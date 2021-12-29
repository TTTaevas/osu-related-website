const production = process.env.PRODUCTION == "true" ? true : false

require('dotenv').config()
const express = require("express")
const session = require("express-session")
const bodyParser = require('body-parser')
const fileUpload = require('express-fileupload')
const mongodb = require("mongodb")
const MongoStore = require("connect-mongo")
const path = require("path")

// import 'em functions
const sessionHandler = require("./functions/session-handler.js")
const tournamentsHandle = require("./functions/tournaments-handle.js")
const request = require("./functions/request.js")
const userCheck = require("./functions/user-check.js")
const referee = require("./functions/referee.js")
const client = require("./database.js")

// express app stuff
const app = express()

// use
app.use(express.urlencoded({extended: true}))
app.use(express.static("public"))
app.use(express.static("views"))
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())
app.use(fileUpload())

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

// set
app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "views"))
if (production) {app.set('trust proxy', 1)}

// get
app.get("/", async (req, res) => {
	let check = await userCheck(client, req.session.user)
	res.status(200).render("home", {user: check.user})
})

app.get("/login", async (req, res) => {
	let status = await sessionHandler(req, client)
	status.ok ? res.status(200).redirect("/") : res.status(201).render("login", {status: status})
})

app.get("/referee", async (req, res) => {
	let check = await userCheck(client, req.session.user)
	let tournaments = await tournamentsHandle("referee")
	res.render("referee", {user: check.user, tournaments: tournaments})
})

app.post("/referee/add", async (req, res) => {
	let check = await userCheck(client, req.session.user, "admin")
	!check.authorized ? res.status(401).send("Unauthorized; not an admin") : await referee.addTournament(req.body, req, res)
})

app.post("/referee/remove", async (req, res) => {
	let check = await userCheck(client, req.session.user, "admin")
	!check.authorized ? res.status(401).send("Unauthorized; not an admin") : await referee.removeTournament(req.body, res)
})

app.post("/referee/import", async (req, res) => {
	let check = await userCheck(client, req.session.user, "admin")
	!check.authorized ? res.status(401).send("Unauthorized; not an admin") : await referee.importTournament(req, res)
})

app.post("/referee/addMatches", async (req, res) => {
	let check = await userCheck(client, req.session.user, "admin")
	!check.authorized ? res.status(401).send("Unauthorized; not an admin") : await referee.addMatches(req.body, res)
})

app.get("/player", async (req, res) => {res.render("player")})

app.use(function(req, res, next) {
	res.status(404).render("fourofour")
})

module.exports = app
