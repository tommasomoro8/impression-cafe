const fs = require("fs")
const util = require('util')
const path = require("path")
const multer = require("multer")
const { openai } = require("../services/openai")
const { db, bucket } = require("../services/firebase")
const textToSpeech = require('@google-cloud/text-to-speech')

const textToSpeechClient = new textToSpeech.TextToSpeechClient({
    credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS)
})

const express = require("express")
const router = express.Router()

const authors = [
    {
        id: "chat-monet",
        name: "Claude Monet",
        voiceName: "it-IT-Neural2-C",
        voicePitch: 0,
        systemContent: "Devi fare finta di essere Claude Monet. Devi parlare sempre in prima persona e non uscire mai dal personaggio. Ti verranno chieste domande sulle tua vita e le tue opere, rispondi come se fosse un discorso a voce tra te e l'utente. Quando ti vengono chieste domande su argomenti non inerenti all'autore, devi dire che non sai rispondere. Usa risposte brevi, usando al massimo 50 o 60 caratteri."
    },
    {
        id: "chat-renoir",
        name: "Pierre-Auguste Renoir",
        voiceName: "it-IT-Neural2-C",
        voicePitch: -1.5,
        systemContent: "Devi fare finta di essere Pierre-Auguste Renoir. Devi parlare sempre in prima persona e non uscire mai dal personaggio. Ti verranno chieste domande sulle tua vita e le tue opere, rispondi come se fosse un discorso a voce tra te e l'utente. Quando ti vengono chieste domande su argomenti non inerenti all'autore, devi dire che non sai rispondere. Usa risposte brevi, usando al massimo 50 o 60 caratteri."
    },
    {
        id: "chat-degas",
        name: "Edgar Degas",
        voiceName: "it-IT-Neural2-C",
        voicePitch: -2.3,
        systemContent: "Devi fare finta di essere Edgar Degas. Devi parlare sempre in prima persona e non uscire mai dal personaggio. Ti verranno chieste domande sulle tua vita e le tue opere, rispondi come se fosse un discorso a voce tra te e l'utente. Quando ti vengono chieste domande su argomenti non inerenti all'autore, devi dire che non sai rispondere. Usa risposte brevi, usando al massimo 50 o 60 caratteri.."
    },
    {
        id: "chat-manet",
        name: "Édouard Manet",
        voiceName: "it-IT-Neural2-C",
        voicePitch: -1,
        systemContent: "Devi fare finta di essere Édouard Manet. Devi parlare sempre in prima persona e non uscire mai dal personaggio. Ti verranno chieste domande sulle tua vita e le tue opere, rispondi come se fosse un discorso a voce tra te e l'utente. Quando ti vengono chieste domande su argomenti non inerenti all'autore, devi dire che non sai rispondere. Usa risposte brevi, usando al massimo 50 o 60 caratteri.."
    }
]
const authorsLength = authors.length

const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
const charactersLength = characters.length

function makePassword(length) {
    let result = "";
    for (let i = 0; i < length; i++)
        result += characters.charAt(Math.floor(Math.random() * charactersLength))
    return result
}

function isAuthorValid(author) {
    for (let i = 0; i < authorsLength; i++)
        if (author === authors[i].id) 
            return i

    return -1
}


router.post("/new-session", async (req, res) => {
    const writePermissionPassword = makePassword(30)

    const response = await db.collection("sessions").add({
        timestamp: parseInt(Date.now()/1000),
        writePermissionPassword
    })

    res.send({
        status: "done",
        sessionId: response.id,
        writePermissionPassword
    })

    db.collection("check-empty-sessions").doc(response.id).set({
        checkAfter: parseInt(Date.now()/1000) + 3600 // 1h dopo
    })
})

const blockedSessions = []

const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, "audio/")
        },
        filename: (req, file, cb) => {
            cb(null, new Date().toISOString() + file.originalname)
        }
    }),
    limits: {
        fileSize: 25000000
    },
    fileFilter: (req, file, cb) => {
        if (req.query["input"] === "text")
            return cb(null, false)

        if (file.mimetype.split("/")[0] !== "audio")
            return cb(new Error(`${file.mimetype.split("/")[0]} type file not allowed - 400`), false)
    
        cb(null, true)
    }
})

function removeFileAudio(filename, inputText) {
    if (inputText)
        return

    fs.unlink(path.join(__dirname, '../audio', filename), (err) => {
        if (err)
            console.error('Error deleting file:', err)
    })
}

module.exports = io => {
    // router.get("/:id", async (req, res) => {
    //     io.of("/chat").to("r8FB6lOuZOtRc3lFMDDY").emit('chat', {
    //         status: "output-audio-stream",
    //         authorId: "authorId",
    //         binaryAudio: req.params.id,
    //         audioOrder: req.params.id,
    //         timestamp: parseInt(Date.now()/1000)
    //     })

    //     res.sendStatus(200)
        
    // })
    
    router.post("/:sessionId/new-chat/:authorId", upload.single("audio"), async (req, res) => {
        const sessionId = req.params.sessionId
        const authorId = req.params.authorId
        const writePermissionPassword = req.headers["writepermissionpassword"]

        const inputText = req.query["input"] === "text"
        const inputTextContent = req.body.inputText

        if (inputText) {
            req.file = {}
            req.file.filename = "null"
        }

    // --- authentication level ---

        if (!inputText && !req.file)
            return res.status(400).send("missing file")
        else if (inputText && !inputTextContent)
            return res.status(400).send("missing inputTextContent")
        
        if (!sessionId || !authorId) {
            removeFileAudio(req.file.filename, inputText)
            return res.status(400).send("missing sessionId or authorId")
        }
        if (!writePermissionPassword) {
            removeFileAudio(req.file.filename, inputText)
            return res.status(401).send("missing password")
        }
    
        //l'autore è uno di quelli noti?
        const authorIndex = isAuthorValid(authorId)
        if (authorIndex < 0) {
            removeFileAudio(req.file.filename, inputText)
            return res.status(400).send("invalid authorId")
        }
        
        //la sessione esiste?
        const check1 = await db.collection("sessions").doc(sessionId).get()
        if (!check1.exists) {
            removeFileAudio(req.file.filename, inputText)
            return res.status(400).send("invalid sessionId")
        }
        //la password sessione è giusta?
        if (check1.data()["writePermissionPassword"] !== writePermissionPassword) {
            removeFileAudio(req.file.filename, inputText)
            return res.sendStatus(401)
        }
    
        if (blockedSessions.includes(sessionId)) {
            removeFileAudio(req.file.filename, inputText)
            return res.status(420).send("a chat is already in the process of creation")
        } else
            blockedSessions.push(sessionId)
    

    // --- transcription level ---
        
        let transcription
        let content

        if (!inputText) {
            try {
                transcription = await openai.audio.transcriptions.create({
                    file: fs.createReadStream(path.join(__dirname, '../audio', req.file.filename)),
                    model: "whisper-1",
                    language: "it"
                })
            } catch (error) {
                console.log(error)
                removeFileAudio(req.file.filename, inputText)
                blockedSessions.splice(blockedSessions.indexOf(sessionId), 1)
                return res.sendStatus(500)
            }
        
            content = transcription.text
    
            try {
                bucket.upload(path.join(__dirname, '../audio', req.file.filename), {
                    destination: `sessions/${sessionId}/${req.file.filename}`,
                    metadata: {
                        contentType: req.file.mimetype
                    },
                }).then(() => {
                    removeFileAudio(req.file.filename, inputText)
    
                    io.of("/chat").to(sessionId).emit('chat', {
                        status: "input",
                        type: "audio-text",
                        authorId,
                        audioId: req.file.filename,
                        audioTranscription: content,
                        timestamp: parseInt(Date.now()/1000)
                    })
                })
            } catch (error) {
                removeFileAudio(req.file.filename, inputText)
            }
        } else {
            content = inputTextContent

            io.of("/chat").to(sessionId).emit('chat', {
                status: "input",
                type: "text",
                authorId,
                audioTranscription: inputTextContent,
                timestamp: parseInt(Date.now()/1000)
            })
        }

    // --- download messages level ---

        //la chat è gia stata inizializzata?    
        let oldChats
        try {
            oldChats = await db.collection("sessions").doc(sessionId).collection(authorId).orderBy("timestamp", "asc").limit(10).get()
        } catch (error) {
            console.log(error)
            res.status(500).send("database download messages error")
        }
        
        let messages = []
        const timeBeforeChatGPT = parseInt(Date.now()/1000)

        if (oldChats.empty) { //se è una nuova chat
            messages = [
                {
                    "role": "system",
                    "content": authors[authorIndex].systemContent
                },
                {
                    "role": "user",
                    "content": content
                }
            ]
        } else { // se no riempo messages con i messaggi vecchi
            oldChats.forEach(doc => {
                const docData = doc.data()
                messages.push({
                    role: docData.role,
                    content: docData.content
                })
            })
            messages.push({
                role: "user",
                content: content
            })
        }


    // --- chat gpt level ---

        let completion
        try {
            completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages,
                temperature: 1,
                // max_tokens: 165,
                top_p: 1,
                frequency_penalty: 0,
                presence_penalty: 0,
                stream: true,
            })
        } catch (error) {
            console.log(error)
            removeFileAudio(req.file.filename, inputText)
            blockedSessions.splice(blockedSessions.indexOf(sessionId), 1)
            return res.sendStatus(500)
        }

        let fullMessage = ""
        let string = ""
        let completionStarted = false

        const audioContainer = {}
        let audioOrder = 0
        let startCheckingAudioLenght = false

        const assistantAudioId = new Date().toISOString() + authorId + ".mp3"

        async function checkingAudioLenght() {   
            if (!startCheckingAudioLenght)
                return

            const arr = Object.values(audioContainer)

            if (arr.length !== audioOrder)
                return

            console.log("ora" + audioOrder + " " +  arr.length)

            
            const buf = Buffer.concat(arr)

            const writeFile = util.promisify(fs.writeFile)
            await writeFile(path.join(__dirname, '../audio', assistantAudioId), buf, 'binary') // se da errore controllare che la cartella /audio esista

            try {
                await bucket.upload(path.join(__dirname, '../audio', assistantAudioId), {
                    destination: `sessions/${sessionId}/${assistantAudioId}`,
                    metadata: {
                        contentType: "audio/mp3"
                    },
                })
            } catch (error) {
                console.log(error)
                removeFileAudio(assistantAudioId)
            }

            removeFileAudio(assistantAudioId)

            io.of("/chat").to(sessionId).emit('chat', {
                status: "output-audio",
                authorId,
                audioId: assistantAudioId,
                timestamp: parseInt(Date.now()/1000)
            })
        }


        for await (const chunk of completion) {
            if (!completionStarted) {
                completionStarted = true
                io.of("/chat").to(sessionId).emit('chat', {
                    status: "start-output-stream",
                    authorId,
                    timestamp: parseInt(Date.now()/1000)
                })
            }

            const text = chunk.choices[0].delta.content

            if (text) {
                fullMessage += text
                string += text

                io.of("/chat").to(sessionId).emit('chat', {
                    status: "output-text-stream",
                    authorId,
                    content: text,
                    timestamp: parseInt(Date.now()/1000)
                })
            }

            if (!string || (!text && chunk.choices[0].finish_reason !== "stop"))
                continue

            if (chunk.choices[0].finish_reason === "stop" || ((text.includes(".") || text.includes("!") || text.includes("?")) && string.length > 6 ) ) {
                const audioOrderInThisLoop = audioOrder
                audioOrder++

                textToSpeechClient.synthesizeSpeech({
                    input: {
                        text: string
                    },
                    voice: {
                        languageCode: "it-IT",
                        name: authors[authorIndex].voiceName
                    },
                    audioConfig: {
                        audioEncoding: 'MP3',
                        pitch: authors[authorIndex].voicePitch,
                        speakingRate: 1
                    },
                }).then(async textToSpeechresponse => {
                    audioContainer[audioOrderInThisLoop] = textToSpeechresponse[0].audioContent

                    io.of("/chat").to(sessionId).emit('chat', {
                        status: "output-audio-stream",
                        authorId,
                        binaryAudio: textToSpeechresponse[0].audioContent,
                        audioOrder: audioOrderInThisLoop,
                        timestamp: parseInt(Date.now()/1000)
                    })

                    checkingAudioLenght()

                }).catch((error) => {
                    console.error(error)
                })

                string = ""
            }
        }

        startCheckingAudioLenght = true

        io.of("/chat").to(sessionId).emit('chat', {
            status: "end-output-stream",
            authorId,
            timestamp: parseInt(Date.now()/1000)
        })

    // --- upload messages level ---

        messages.push({
            "role": "assistant",
            "content": fullMessage
        })

        const batch = db.batch()

        if (oldChats.empty) { //se è una nuova chat
            messages.forEach((doc) => {
                switch (doc.role) {
                    case "assistant":
                        doc.timestamp = parseInt(Date.now()/1000)
                        doc.audioId = assistantAudioId
                    break
                    case "system":
                        doc.timestamp = timeBeforeChatGPT - 2
                    break
                    case "user":
                        doc.timestamp = timeBeforeChatGPT - 1
                        if (!inputText)
                            doc.audioId = req.file.filename
                    break
                }
                
                const docRef = db.collection("sessions").doc(sessionId).collection(authorId).doc()
                batch.set(docRef, doc)
            })
        } else {
            for (let i = messages.length-2; i < messages.length; i++) {
                const obj = messages[i]
    
                if (obj.role === "assistant") {
                    obj.timestamp = parseInt(Date.now()/1000)
                    obj.audioId = assistantAudioId
                }
                else {
                    obj.timestamp = timeBeforeChatGPT - 1
                    if (!inputText)
                        obj.audioId = req.file.filename
                }
    
                const docRef = db.collection("sessions").doc(sessionId).collection(authorId).doc()
                batch.set(docRef, obj)
            }
        }

        await batch.commit()

        
    // --- response level ---

        const finalRespose = {
            status: "done",
            audioTranscription: content,
            assistantAudioId,
            response: fullMessage
        }

        if (!inputText)
            finalRespose.audioId = req.file.filename
    
        res.send(finalRespose)
    
        blockedSessions.splice(blockedSessions.indexOf(sessionId), 1)
    })

    return router
}