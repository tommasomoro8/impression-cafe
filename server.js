const cookieParser = require("cookie-parser")
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')

const express = require("express")
const app = express()

require('dotenv').config()
const dev = process.env.NODE_ENV === 'development'

/* routes */
const api = require('./routes/api')

/* middleware */
const secureHttps = require("./middleware/secureHttps")
const removeLastSlash = require("./middleware/removeLastSlash")

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'"],
            connectSrc: ["'self'"],
            scriptSrcAttr: ["'unsafe-inline'"]
        },
    }
}))
app.use(rateLimit({
    windowMs: 60 * 1000,
    max: (dev) ? 99999999 : 100,
    message: 'Too many requests from this IP, please try again later',
    handler: (req, res) => {
        res.sendStatus(429)
    }
}))
app.set("trust proxy", true)
app.use(secureHttps(dev))
app.use(cookieParser())
app.use(removeLastSlash)

app.use("/api", api)

app.get("*", (req, res) => {
    res.sendStatus(404)
})

app.use((err, req, res, next) => {
    console.error(err.stack)
    res.sendStatus(500)
})

const port = process.env.PORT || 3000
app.listen(port, () => {
    console.log(`listening on port ${port} in ${process.env.NODE_ENV} mode...`)
})