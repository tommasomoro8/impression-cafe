const { bucket, getDownloadURL } = require("../services/firebase")

const express = require("express")
const router = express.Router()

router.get("/:sessionId/:audioId", async (req, res) => {
    const sessionId = req.params.sessionId
    const audioId = req.params.audioId
    
    if (!sessionId || !audioId)
        return res.sendStatus(400)

    const fileRef = bucket.file(`sessions/${sessionId}/${audioId}`)
    const downloadURL = await getDownloadURL(fileRef)

    res.redirect(downloadURL)
})

module.exports = router