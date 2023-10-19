const chatPage = require("../views/chat/index")
const { db } = require("../services/firebase")
    
const express = require("express")
const router = express.Router()

router.get("/:sessionId", async (req, res) => {
    const sessionId = req.params.sessionId
    
    if (!sessionId)
        return res.sendStatus(400)

    let sessionDoc 
    try {
        sessionDoc = await db.collection("sessions").doc(sessionId).listCollections()
    } catch (error) {
        return res.send(500)
    }
  
    if (!sessionDoc.length)
        return res.status(400).send("the session does not exist")


    const chats = {}

    for (let i = 0; i < sessionDoc.length; i++) {
        const authorId = sessionDoc[i].id
        chats[authorId] = []

        const authorChat = await sessionDoc[i].orderBy("timestamp", "asc").get()
        authorChat.forEach(doc => {
            const obj = doc.data()
            obj.id = doc.id

            chats[authorId].push(obj)
        })
    }

    res.send(chatPage(sessionId, chats))
})

module.exports = io => {
    io.of("/chat").on('connection', async socket => {
        const sessionId = socket.handshake.query.sessionId

        if (!sessionId)
            return socket.disconnect()
    
        const sessionDoc = await db.collection("sessions").doc(sessionId).get()
        if (!sessionDoc.exists)
            return res.status(400).send("invalid sessionId")
        
        socket.join(sessionId)
    
        socket.on('disconnect', () => {
            socket.leave(sessionId)
        })
    })
    
    return router
}
