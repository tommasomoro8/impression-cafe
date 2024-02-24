const path = require('path')
const cookieParser = require("cookie-parser")
const helmet = require('helmet')
const rateLimit = require('express-rate-limit') // use "node": "14.x" in glitch

const express = require("express")
const app = express()

const http = require("http")
const server = http.createServer(app)
const { Server } = require("socket.io")
const io = new Server(server)

require('dotenv').config()
const dev = process.env.NODE_ENV === 'development'

/* routes */
const api = require('./routes/api')(io)
const audio = require('./routes/audio')
const chat = require('./routes/chat')(io)

/* middleware */
const secureHttps = require("./middleware/secureHttps")
const removeLastSlash = require("./middleware/removeLastSlash")

/* pages */
const landingPage = require("./views/landing")

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.socket.io"],
            mediaSrc: ["'self'", "blob:", "https://firebasestorage.googleapis.com"],
            scriptSrcAttr: ["'unsafe-inline'"]
        },
    }
}))
app.use(rateLimit({
    windowMs: 60 * 1000,
    max: (dev) ? 99999999 : 200,
    message: 'Too many requests from this IP, please try again later',
    handler: (req, res) => {
        res.sendStatus(429)
    }
}))
app.set("trust proxy", true)
app.use(secureHttps(dev))
app.use(cookieParser())
app.use(removeLastSlash)

app.use("/", express.static('./static'))

io.of("/").on('connection', async socket => {

    console.log(socket.handshake.query)

    socket.on('message', () => {
        console.log("message")

        io.emit("message", "hello")
    })
    
    socket.on('disconnect', () => {
        console.log("bye bye " + JSON.stringify(socket.handshake.query))
    })
})

app.get("/", (req, res) => {
    res.setHeader("Content-Type", "text/html")
    res.send(landingPage("it"))
})

app.get("/it", (req, res) => res.redirect("/"))
app.get("/en", (req, res) => {
    res.setHeader("Content-Type", "text/html")
    res.send(landingPage("en"))
})

app.use("/api", api)
app.use("/audio", audio)
app.use("/chat", chat)

app.get("*", (req, res) => {
    res.sendStatus(404)
})

app.use((err, req, res, next) => {
    console.error(err.stack)
    res.sendStatus(500)
})

const port = process.env.PORT || 3000
server.listen(port, () => {
    console.log(`listening on port ${port} in ${process.env.NODE_ENV} mode...`)
})