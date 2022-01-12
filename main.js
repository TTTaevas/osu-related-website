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

app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "views"))
if (production) {app.set('trust proxy', 1)}


// import 'em functions (site-wide)
const sessionHandler = require("./functions/session-handler.js")
const userCheck = require("./functions/user-check.js")

// (history-wide)
const tournamentsHandle = require("./functions/tournaments-handle.js")
const referee = require("./functions/referee.js")

// (layer01-wide)
const formHandler = require("./functions/form-handler.js")
const addStaff = require("./functions/add-staff.js")


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

app.get("/history/player", async (req, res) => {res.render("history/player")})

app.get("/history/*", (req, res) => {
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
	status.ok ? res.status(200).redirect("/layer01") : res.status(201).render("layer01/login", {status: status})
})

app.get("/layer01/rules", async (req, res) => {
	let check = await userCheck(client, req.session.user)
	res.status(200).render("layer01/rules", {user: check.user})
})

app.get("/layer01/staff-registration", async (req, res) => {
	let check = await userCheck(client, req.session.user)
	let message = null
	if (check.user.roles.registered_staff) {message = "You have already registered as staff, but feel free to reregister if you need to change something :3"}
	if (check.user.roles.staff) {message = "You are already staff! You should ask Taevas if you want to change something :3c"}
	check.user ? res.status(200).render("layer01/staff-registration", {user: check.user, message: message}) : res.redirect("/layer01")
})

app.post("/layer01/staff-registration", async (req, res) => {
	let check = await userCheck(client, req.session.user)
	if (!check.user) {return res.status(403).render("layer01/error", {status: {code: 403, reason: "Probably not logged in"}})}
	let form = await formHandler.staff(check.user, check.collection, check.db, req.body)
	res.status(200).render("layer01/staff-registration", {user: check.user, message: form.message})
})

app.get("/layer01/staff-regs", async (req, res) => {
	let check = await userCheck(client, req.session.user, "admin")
	if (!check.authorized) {return res.status(403).render("layer01/error", {status: {code: 403, reason: "Unauthorized; you shouldn't be there :3c"}})}

	let regs_col = check.db.collection("staff_regs")
	let regs = await regs_col.find().toArray()
	for (let i = 0; i < regs.length; i++) {regs[i].user = check.users.find((user) => user.id == regs[i].id)}
	res.status(200).render("layer01/staff-regs", {user: check.user, regs: regs})
})

app.post("/layer01/staff-regs", async (req, res) => {
	let check = await userCheck(client, req.session.user, "admin")
	if (!check.authorized) {return res.status(403).render("layer01/error", {status: {code: 403, reason: "Unauthorized; you shouldn't be there :3c"}})}
	await addStaff(check.db, check.collection, req.body)
	res.redirect("/layer01/staff-regs")
})

app.get("/layer01/*", (req, res) => {
	res.status(404).render("layer01/fourofour")
})

app.use(function(req, res, next) {
	res.status(404).render("fourofour")
})


module.exports = app
