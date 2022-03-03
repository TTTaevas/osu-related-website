const production = process.env.PRODUCTION == "true" ? true : false
const { auth } = require("./db-clients.js")

require("dotenv").config()
const glob = require("glob")
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
	store: new MongoStore({client: auth})
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


// ROUTES STUFF

app.all("*", async (req, res, next) => { // Previously known as "userCheck"
	const db = auth.db()
	const collection = db.collection("users")

	const users = await collection.find().toArray()
	const user = users.find((u) => {return u.id == req.session.user})

	req.auth = {
		client: auth,
		db: auth.db(),
		user: user ? user : false,
		users: {
			collection: collection,
			array: users
		}
	}

	next()
})

glob.sync("./routes/*.js").forEach((f) => {
	const p = f.substring(f.lastIndexOf("/"), f.lastIndexOf("."))
	const callback = require(path.resolve(f))
	app.use(p, callback)
})

app.get("/", async (req, res) => {res.render("home")})
app.use(function(req, res, next) {res.status(404).render("fourofour")})

module.exports = app
