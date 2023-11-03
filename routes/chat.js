const chatPage = require("../views/chat/index")
const { db } = require("../services/firebase")
    
const express = require("express")
const router = express.Router()

router.get("/:sessionId", async (req, res) => {
    const sessionId = req.params.sessionId
    
    // if (!sessionId)
    //     return res.sendStatus(400)

    // let sessionTest
    // try {
    //     sessionTest = await db.collection("sessions").doc(sessionId).get()
    // } catch (error) {
    //     return res.send(500)
    // }

    // if (!sessionTest.exists)
    //     return res.status(400).send("the session does not exist")

    // const sessionCreationTimestamp = sessionTest.data().timestamp


    // let sessionDoc 
    // try {
    //     sessionDoc = await db.collection("sessions").doc(sessionId).listCollections()
    // } catch (error) {
    //     return res.send(500)
    // }

    const chats = {}

    // for (let i = 0; i < sessionDoc.length; i++) {
    //     const authorId = sessionDoc[i].id
    //     chats[authorId] = []

    //     const authorChat = await sessionDoc[i].orderBy("timestamp", "asc").get()
    //     authorChat.forEach(doc => {
    //         const obj = doc.data()
            
    //         if (obj.role !== "system") {
    //             obj.id = doc.id
    //             chats[authorId].push(obj)
    //         }
    //     })
    // }
    
    res.setHeader("Content-Type", "text/html")
    res.send(chatPage(sessionId, chats, "sessionCreationTimestamp"))
})

module.exports = io => {
    io.of("/chat").on('connection', async socket => {
        const sessionId = socket.handshake.query.sessionId

        if (!sessionId)
            return socket.disconnect()
    
        const sessionDoc = await db.collection("sessions").doc(sessionId).get()
        if (!sessionDoc.exists)
            return socket.disconnect()
        
        socket.join(sessionId)
    
        socket.on('disconnect', () => {
            socket.leave(sessionId)
        })
    })
    
    return router
}
