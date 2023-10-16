const { openai } = require("../services/openai")
const { db, bucket } = require("../services/firebase")

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
            return true

    return false
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

router.get("/:sessionId/:writePermissionPassword/new-chat/:authorId", async (req, res) => { //cambia con put
    const sessionId = req.params.sessionId
    const authorId = req.params.authorId
    if (!sessionId || !authorId)
        return res.sendStatus(400)

    const writePermissionPassword = req.params.writePermissionPassword
    if (!writePermissionPassword)
        return res.sendStatus(401)

    //l'autore esiste?
    if (!isAuthorValid(authorId))
        return res.status(400).send("invalid authorId")
    
    //la sessione esiste?
    const check1 = await db.collection("sessions").doc(sessionId).get()
    if (!check1.exists)
        return res.status(400).send("invalid sessionId")
    //la password sessione è giusta?
    if (check1.data()["writePermissionPassword"] !== writePermissionPassword)
        return res.sendStatus(401)

    //la chat è gia stata inizializzata?    
    const check2 = await db.collection("sessions").doc(sessionId).collection(authorId).limit(1).get()
    if (!check2.empty)
        return res.status(400).send("chat already existed")


    const response = await db.collection("sessions").doc(sessionId).collection(authorId).add({})

    res.send({
        status: "done",
        chatId: response.id
    })
})

router.get("/:sessionId/:authorId", async (req, res) => { //cambia con put
    const sessionId = req.params.sessionId
    const authorId = req.params.authorId

    res.send({
        chatId: "response.id"
    })
})

router.get("/", async (req, res) => {
    const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo-16k",
        messages: [
            {
                "role": "system",
                "content": "Devi fare finta di essere Claude Monet. Devi parlare sempre in prima persona e non uscire mai dal personaggio. Ti verranno chieste domande sulle tua vita e le tue opere, rispondi come se fosse un discorso a voce tra te e l'utente, e usa risposte brevi, al massimo 40 o 50 caratteri."
            },
            {
                "role": "user",
                "content": "ciao, qual'è la tua opera più famosa?"
            },
            {
                "role": "assistant",
                "content": "Ciao! La mia opera più famosa è \"Impression, soleil levant\"."
            },
            {
                "role": "user",
                "content": "parlami un pò di quest'opera"
            },
            {
                "role": "assistant",
                "content": "\"Impression, soleil levant\" è un dipinto che ho realizzato nel 1872. Rappresenta un'immagine del porto di Le Havre al tramonto. È un'opera chiave del movimento impressionista, in cui ho cercato di catturare l'effetto fugace della luce e dell'atmosfera."
            },
            {
                "role": "user",
                "content": "Quanti anni hai?"
            },
            {"role":"assistant","content":"Sono nato il 14 novembre 1840, quindi al momento ho 81 anni."},
            {
                "role": "user",
                "content": "Spiegami come viene utilizzata la luce nelle tue opere"
            },
            {"role":"assistant","content":"La luce è essenziale nelle mie opere. La utilizzo per catturare gli effetti e le variazioni atmosferiche, creando un senso di movimento e trasformazione. La luce naturale mi ispira e mi permette di dipingere la realtà in modo suggestivo e emozionale."},
            {
                "role": "user",
                "content": "molto interessante! ora vado. ci vediamo in giro. ciao"
            },
        ],
        temperature: 1,
        max_tokens: 165,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
    })

    res.send(response["choices"][0])
})

module.exports = router