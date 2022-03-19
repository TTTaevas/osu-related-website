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
		expires: 61 * 24 * 3600000
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
	const user = await collection.findOne({id: req.session.user})

	req.auth = {
		client: auth,
		db: auth.db(),
		user: user ? user : false,
		users: { // For optimization reasons, only request all users when needed
			collection: collection,
			array: async function() {return await collection.find().toArray()}
		}
	}

	next()
})

// Because of a **very** funny bug where every route alphabetically after "root" doesn't work
// (as glob.sync.forEach treats everything alphabetically)
// the root is treated after every other route
let root = "./routes/root.js"

glob.sync("./routes/*.js").filter((r) => r != root).forEach((f) => {
	let callback = require(path.resolve(f))
	app.use(f.substring(f.lastIndexOf("/"), f.lastIndexOf(".")), callback)
})

let callback = require(path.resolve(root))
app.use("/", callback)

module.exports = app
