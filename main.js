const production = process.env.PRODUCTION == "true" ? true : false
const client = require("./database.js")

require('dotenv').config()
const path = require("path")


// express configuration stuff
const express = require("express")
const app = express()

app.use(express.urlencoded({extended: true}))
app.use(express.static("public"))
app.use(express.static("views"))

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
				imgSrc: ["'self'", "https://osuflags.omkserver.nl/"],
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

app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "views"))
if (production) {app.set('trust proxy', 1)}


// import 'em functions
const sessionHandler = require("./functions/session-handler.js")
const tournamentsHandle = require("./functions/tournaments-handle.js")
const userCheck = require("./functions/user-check.js")
const referee = require("./functions/referee.js")


// get main
app.get("/", async (req, res) => {res.render("home")})

// get history
app.get("/history", async (req, res) => {
	let check = await userCheck(client, req.session.user)
	res.status(200).render("history/home", {user: check.user})
})

// app.get("/history/login", async (req, res) => {
// 	let status = await sessionHandler(req, client)
// 	status.ok ? res.status(200).redirect("/history") : res.status(201).render("login", {status: status})
// })

app.get("/history/referee", async (req, res) => {
	let check = await userCheck(client, req.session.user)
	let tournaments = await tournamentsHandle("referee")
	res.render("history/referee", {user: check.user, tournaments: tournaments})
})

app.get("/history/player", async (req, res) => {res.render("player")})

app.get("/history/:a", (req, res) => {
	res.status(404).render("history/fourofour")
})

// post history
app.post("/history/referee/add", async (req, res) => {
	let check = await userCheck(client, req.session.user, "admin")
	!check.authorized ? res.status(401).send("Unauthorized; not an admin") : await referee.addTournament(req.body, req.files, res)
})

app.post("/history/referee/remove", async (req, res) => {
	let check = await userCheck(client, req.session.user, "admin")
	!check.authorized ? res.status(401).send("Unauthorized; not an admin") : await referee.removeTournament(req.body, res)
})

app.post("/history/referee/import", async (req, res) => {
	let check = await userCheck(client, req.session.user, "admin")
	!check.authorized ? res.status(401).send("Unauthorized; not an admin") : await referee.importTournament(req.files, res)
})

app.post("/history/referee/addMatches", async (req, res) => {
	let check = await userCheck(client, req.session.user, "admin")
	!check.authorized ? res.status(401).send("Unauthorized; not an admin") : await referee.addMatches(req.body, res)
})


// get layer01
app.get("/layer01", async (req, res) => {
	let check = await userCheck(client, req.session.user)
	res.status(200).render("layer01/home", {user: check.user})
})

app.get("/layer01/login", async (req, res) => {
	let status = await sessionHandler(req, client)
	status.ok ? res.status(200).redirect("/layer01") : res.status(201).render("login", {status: status})
})



app.use(function(req, res, next) {
	res.status(404).render("fourofour")
})


module.exports = app
