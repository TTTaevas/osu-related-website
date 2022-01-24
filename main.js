const production = process.env.PRODUCTION == "true" ? true : false
const client = require("./database.js")

require("dotenv").config()
const path = require("path")

// express configuration stuff
const express = require("express")
const app = express()

app.use(express.urlencoded({extended: true}))
app.use(express.static("public"))
app.set("view engine", "ejs")

const MongoStore = require("connect-mongo")
const session = require("express-session")
app.use(session({
	secret: process.env.SESSION_SECRET,
	resave: false,
	saveUninitialized: false,
	cookie: {
		secure: production,
		expires: 14 * 24 * 3600000
	},
	store: new MongoStore({client: client})
}))

const helmet = require('helmet')
app.use(
	helmet({
		contentSecurityPolicy: {
			directives: {
				defaultSrc: ["'self'"],
				scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
				imgSrc: ["'self'", "https://osuflags.omkserver.nl/", "https://*.ppy.sh/"],
				styleSrc: ["'self'", "'unsafe-inline'"]
			}
		}
	})
)

const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())

const fileUpload = require('express-fileupload')
app.use(fileUpload())

const rateLimit = require('express-rate-limit')
const rateLimiter = rateLimit({
	windowMs: 60 * 1000, // 1 minute
	max: 40, // 40 requests per IP per minute
	message: "You are currently being rate-limited, please try again soon",
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})
app.use(rateLimiter)

if (production) {app.set('trust proxy', 1)}

const layer01 = require("./app/layer01")
app.use("/layer01", layer01)

const history = require("./app/history")
app.use("/history", history)

app.get("/", async (req, res) => {
	res.render("home")
})

app.use(function(req, res, next) {
	res.status(404).render("fourofour")
})

module.exports = app
