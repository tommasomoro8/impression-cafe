const fs = require("fs")
const path = require("path")
const multer = require("multer")
const { openai } = require("../services/openai")
const { db, bucket, getDownloadURL } = require("../services/firebase")

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

router.get("/new-session", async (req, res) => { //cambia con post
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

// router.get("/:sessionId/:writePermissionPassword/new-chat/:authorId/:content", async (req, res) => { //cambia con put
//     const sessionId = req.params.sessionId
//     const authorId = req.params.authorId
//     const content = req.params.content //cambia con body
//     if (!sessionId || !authorId || !content)
//         return res.sendStatus(400)

//     const writePermissionPassword = req.params.writePermissionPassword
//     if (!writePermissionPassword)
//         return res.sendStatus(401)

//     //l'autore è uno di quelli noti?
//     const authorIndex = isAuthorValid(authorId)
//     if (authorIndex < 0)
//         return res.status(400).send("invalid authorId")
    
//     //la sessione esiste?
//     const check1 = await db.collection("sessions").doc(sessionId).get()
//     if (!check1.exists)
//         return res.status(400).send("invalid sessionId")
//     //la password sessione è giusta?
//     if (check1.data()["writePermissionPassword"] !== writePermissionPassword)
//         return res.sendStatus(401)

//     if (blockedSessions.includes(sessionId)) {
//         return res.status(420).send("a chat is already in the process of creation")
//     } else {
//         blockedSessions.push(sessionId)
//     }

//     //la chat è gia stata inizializzata?    
//     const oldChats = await db.collection("sessions").doc(sessionId).collection(authorId).orderBy("timestamp", "asc").get()
    
//     let messages = []
//     const timeBeforeChatGPT = parseInt(Date.now()/1000)

//     if (oldChats.empty) { //se è una nuova chat
//         messages = [
//             {
//                 "role": "system",
//                 "content": authors[authorIndex].systemContent
//             },
//             {
//                 "role": "user",
//                 "content": content
//             }
//         ]
//     } else { // se no riempo messages con i messaggi vecchi
//         oldChats.forEach(doc => {
//             const docData = doc.data()
//             messages.push({
//                 role: docData.role,
//                 content: docData.content
//             })
//         })
//         messages.push({
//             role: "user",
//             content: content
//         })
//     }

//     let response
//     try {
//         response = await openai.chat.completions.create({
//             model: "gpt-3.5-turbo-16k",
//             messages,
//             temperature: 1,
//             max_tokens: 165,
//             top_p: 1,
//             frequency_penalty: 0,
//             presence_penalty: 0,
//         })
//     } catch (error) {
//         console.error(error)
//         return res.sendStatus(500)
//     }


//     messages.push(response["choices"][0]["message"])

//     const batch = db.batch()
//     if (oldChats.empty) { //se è una nuova chat
//         messages.forEach((doc) => {
//             if (doc.role === "assistant")
//                 doc.timestamp = parseInt(Date.now()/1000)
//             else
//                 doc.timestamp = (doc.role === "system") ? timeBeforeChatGPT - 2 : timeBeforeChatGPT - 1
            
//             const docRef = db.collection("sessions").doc(sessionId).collection(authorId).doc()
//             batch.set(docRef, doc)
//         })
//     } else {
//         for (let i = messages.length-2; i < messages.length; i++) {
//             const obj = messages[i]

//             if (obj.role === "assistant")
//                 obj.timestamp = parseInt(Date.now()/1000)
//             else
//                 obj.timestamp = timeBeforeChatGPT - 1

//             const docRef = db.collection("sessions").doc(sessionId).collection(authorId).doc()
//             batch.set(docRef, obj)
//         }
//     }
//     await batch.commit()
 
//     res.send({
//         status: "done",
//         response: response["choices"][0]["message"]["content"]
//     })

//     blockedSessions.splice(blockedSessions.indexOf(sessionId), 1)
// })







// router.get("/audio-test", async (req, res) => {
//     const transcription = await openai.audio.transcriptions.create({
//         file: fs.createReadStream(path.join(__dirname, '../audio', 'ivan.m4a')),
//         model: "whisper-1",
//         language: "it"
//     })

//     console.log(transcription)

//     res.send(transcription)
// })




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


router.get("/:sessionId/new-chat/:authorId", upload.single("audio"), async (req, res) => { //cambia con put
    const sessionId = req.params.sessionId
    const authorId = req.params.authorId
    const writePermissionPassword = req.headers["writepermissionpassword"]

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

    try {
        bucket.upload(path.join(__dirname, '../audio', req.file.filename), {
            destination: `sessions/${sessionId}/${req.file.filename}`,
            metadata: {
                contentType: req.file.mimetype
            },
        }).then(() => {
            removeFileAudio(req.file.filename)
        })
    } catch (error) {
        removeFileAudio(req.file.filename)
    }

    //la chat è gia stata inizializzata?    
    const oldChats = await db.collection("sessions").doc(sessionId).collection(authorId).orderBy("timestamp", "asc").get()
    
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

    let response
    try {
        response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo-16k",
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


    messages.push(response["choices"][0]["message"])

    const batch = db.batch()
    if (oldChats.empty) { //se è una nuova chat
        messages.forEach((doc) => {
            switch (doc.role) {
                case "assistant":
                    doc.timestamp = parseInt(Date.now()/1000)
                break
                case "system":
                    doc.timestamp = timeBeforeChatGPT - 2
                break
                case "user":
                    doc.timestamp = timeBeforeChatGPT - 1
                    doc.audio = `sessions/${sessionId}/${req.file.filename}`
                break
            }
            
            const docRef = db.collection("sessions").doc(sessionId).collection(authorId).doc()
            batch.set(docRef, doc)
        })
    } else {
        for (let i = messages.length-2; i < messages.length; i++) {
            const obj = messages[i]

            if (obj.role === "assistant")
                obj.timestamp = parseInt(Date.now()/1000)
            else {
                obj.timestamp = timeBeforeChatGPT - 1
                obj.audio = `sessions/${sessionId}/${req.file.filename}`
            }

            const docRef = db.collection("sessions").doc(sessionId).collection(authorId).doc()
            batch.set(docRef, obj)
        }
    }
    await batch.commit()
 
    res.send({
        status: "done",
        response: response["choices"][0]["message"]["content"]
    })

    blockedSessions.splice(blockedSessions.indexOf(sessionId), 1)
})



router.get("/test/:id/:lol", async (req, res) => {
    const fileRef = bucket.file('sessions/' + req.params.id + "/" + req.params.lol);
    const downloadURL = await getDownloadURL(fileRef);
    res.redirect(downloadURL)
})








module.exports = router