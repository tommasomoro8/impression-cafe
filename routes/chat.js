const chatPage = require("../views/chat/index")

const express = require("express")
const router = express.Router()

router.get("/:sessionId", async (req, res) => {
    const sessionId = req.params.sessionId
    
    if (!sessionId)
        return res.sendStatus(400)

    res.send(chatPage(["ciao", "bella", sessionId]))
})

module.exports = router