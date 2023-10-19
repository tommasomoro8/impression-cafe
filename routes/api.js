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
        systemContent: "Devi fare finta di essere Claude Monet. Devi parlare sempre in prima persona e non uscire mai dal personaggio. Ti verranno chieste domande sulle tua vita e le tue opere, rispondi come se fosse un discorso a voce tra te e l'utente, e usa risposte brevi, al massimo 40 o 50 caratteri."

    },
    {
        id: "chat-seurat",
        name: "Georges Seurat",
        systemContent: "Devi fare finta di essere Georges Seurat. Devi parlare sempre in prima persona e non uscire mai dal personaggio. Ti verranno chieste domande sulle tua vita e le tue opere, rispondi come se fosse un discorso a voce tra te e l'utente, e usa risposte brevi, al massimo 40 o 50 caratteri."
    },
    {
        id: "chat-degas",
        name: "Edgar Degas",
        systemContent: "Devi fare finta di essere Edgar Degas. Devi parlare sempre in prima persona e non uscire mai dal personaggio. Ti verranno chieste domande sulle tua vita e le tue opere, rispondi come se fosse un discorso a voce tra te e l'utente, e usa risposte brevi, al massimo 40 o 50 caratteri."
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
        sessionsId: response.id,
        writePermissionPassword
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
        if (file.mimetype.split("/")[0] !== "audio")
            return cb(new Error(`${file.mimetype.split("/")[0]} type file not allowed - 400`), false)
    
        cb(null, true)
    }
})

function removeFileAudio(filename) {
    fs.unlink(path.join(__dirname, '../audio', filename), (err) => {
        if (err)
          console.error('Error deleting file:', err)
    })
}

module.exports = io => {
    router.post("/:sessionId/new-chat/:authorId", upload.single("audio"), async (req, res) => {
        const sessionId = req.params.sessionId
        const authorId = req.params.authorId
        const writePermissionPassword = req.headers["writepermissionpassword"]
    const tempo1 = Date.now()
    
        if (!req.file)
            return res.sendStatus(400)
        
        if (!sessionId || !authorId) {
            removeFileAudio(req.file.filename)
            return res.sendStatus(400)
        }
        if (!writePermissionPassword) {
            removeFileAudio(req.file.filename)
            return res.sendStatus(401)
        }
    
        //l'autore è uno di quelli noti?
        const authorIndex = isAuthorValid(authorId)
        if (authorIndex < 0) {
            removeFileAudio(req.file.filename)
            return res.status(400).send("invalid authorId")
        }
        
        //la sessione esiste?
        const check1 = await db.collection("sessions").doc(sessionId).get()
        if (!check1.exists) {
            removeFileAudio(req.file.filename)
            return res.status(400).send("invalid sessionId")
        }
        //la password sessione è giusta?
        if (check1.data()["writePermissionPassword"] !== writePermissionPassword) {
            removeFileAudio(req.file.filename)
            return res.sendStatus(401)
        }
    
        if (blockedSessions.includes(sessionId)) {
            removeFileAudio(req.file.filename)
            return res.status(420).send("a chat is already in the process of creation")
        } else
            blockedSessions.push(sessionId)
    
    const tempo2 = Date.now()
        let transcription
        try {
            transcription = await openai.audio.transcriptions.create({
                file: fs.createReadStream(path.join(__dirname, '../audio', req.file.filename)),
                model: "whisper-1",
                language: "it"
            })
        } catch (error) {
            console.log(error)
            removeFileAudio(req.file.filename)
            return res.sendStatus(500)
        }
    
        const content = transcription.text

    const tempo3 = Date.now()
        try {
            bucket.upload(path.join(__dirname, '../audio', req.file.filename), {
                destination: `sessions/${sessionId}/${req.file.filename}`,
                metadata: {
                    contentType: req.file.mimetype
                },
            }).then(() => {
                removeFileAudio(req.file.filename)

                io.of("/chat").to(sessionId).emit('chat', {
                    status: "only-input",
                    authorId,
                    audioId: req.file.filename,
                    audioTranscription: content,
                    timestamp: parseInt(Date.now()/1000)
                })
            })
        } catch (error) {
            removeFileAudio(req.file.filename)
        }

    const tempo4 = Date.now()
        //la chat è gia stata inizializzata?    
        const oldChats = await db.collection("sessions").doc(sessionId).collection(authorId).orderBy("timestamp", "asc").get()
        
        let messages = []
        const timeBeforeChatGPT = parseInt(Date.now()/1000)
    const tempo5 = Date.now()
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
    const tempo6 = Date.now()
        let response
        try {
            response = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages,
                temperature: 1,
                max_tokens: 165,
                top_p: 1,
                frequency_penalty: 0,
                presence_penalty: 0,
            })
        } catch (error) {
            console.error(error)
            return res.sendStatus(500)
        }
    
    const tempo7 = Date.now()
        messages.push(response["choices"][0]["message"])
    
        const assistantAudioId = new Date().toISOString() + authorId + ".mp3" //se cambi tipo di file da textToSpeech cambia .mp3 finale
    
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
                    obj.audioId = req.file.filename
                }
    
                const docRef = db.collection("sessions").doc(sessionId).collection(authorId).doc()
                batch.set(docRef, obj)
            }
        }
        await batch.commit()
    const tempo8 = Date.now()
    
        let textToSpeechresponse
    
        try {
            textToSpeechresponse = await textToSpeechClient.synthesizeSpeech({
                input: {
                    text: response["choices"][0]["message"]["content"]
                },
                voice: {
                    languageCode: "it-IT",
                    name: "it-IT-Neural2-C"
                },
                audioConfig: {
                    audioEncoding: 'MP3',
                    pitch: -2.8,
                    speakingRate: 1
                },
            })
        } catch (error) {
            console.error(error)
            return res.sendStatus(500)
        }
            
        const writeFile = util.promisify(fs.writeFile)
        await writeFile(path.join(__dirname, '../audio', assistantAudioId), textToSpeechresponse[0].audioContent, 'binary')
    
    
    const tempo9 = Date.now()
    
        try {
            await bucket.upload(path.join(__dirname, '../audio', assistantAudioId), {
                destination: `sessions/${sessionId}/${assistantAudioId}`,
                metadata: {
                    contentType: "audio/mp3"
                },
            })
        } catch (error) {
            removeFileAudio(assistantAudioId)
        }
    
        removeFileAudio(assistantAudioId)
    
    const tempo10 = Date.now()

        const finalRespose = {
            status: "done",
            audioId: req.file.filename,
            audioTranscription: content,
            assistantAudioId,
            response: response["choices"][0]["message"]["content"]
        }
    
        res.send(finalRespose)

        finalRespose.authorId = authorId
        finalRespose.status = "done"
        finalRespose.timestamp = parseInt(Date.now()/1000)
        
        // notare che la risposta finale ha una piccola probabilità di arrivare dopo il only-input
        // in quanto esso viene mandato dopo che l'audio di input viene uplodato sul cloud
        // e non aspetta la fine prima di procedere col codice
        io.of("/chat").to(sessionId).emit('chat', finalRespose)
    
        blockedSessions.splice(blockedSessions.indexOf(sessionId), 1)
    
        console.log("check di permessi, sessione e password", tempo2 - tempo1)
        console.log("speech to text", tempo3 - tempo2)
        console.log("chat gpt", tempo7 - tempo6)
        console.log("salva risposte su database", tempo8 - tempo7)
        console.log("text to speech", tempo9 - tempo8)
        console.log("tempotot", tempo10 - tempo1)
    })

    return router
}