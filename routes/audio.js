const { bucket, getDownloadURL } = require("../services/firebase")

const express = require("express")
const router = express.Router()

router.get("/:sessionId/:audioId", async (req, res) => {
    const sessionId = req.params.sessionId
    const audioId = req.params.audioId
    
    if (!sessionId || !audioId)
        return res.sendStatus(400)

    const fileRef = bucket.file(`sessions/${sessionId}/${audioId}`)
    try {
        res.redirect(await getDownloadURL(fileRef))
    } catch (error) {
        res.sendStatus(error.code)
    }
})

module.exports = router