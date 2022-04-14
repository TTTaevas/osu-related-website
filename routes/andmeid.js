const express = require("express")
const router = express.Router()

const { andmeid } = require("../db-clients.js")
const validator = require("./validators/andmeid.js")

// Similar stuff is being required in LAYER01; keep it in mind
router.all("*", async (req, res, next) => {
	req.andmeid = {
		client: andmeid,
		db: andmeid.db()
	}

	let roles = {}
	if (req.auth.user) {
		let found_roles = await req.andmeid.db.collection("roles").findOne({id: req.auth.user.id})
		if (found_roles) {roles = found_roles.roles}
	}
	req.roles = roles

	next()
})

const uc = function(req, res, next, roles) {
	if (!req.auth.user) {return req.method == "POST" ? res.status(401).json({status: false, error: "Unauthorized; Please login first"})
	: res.status(401).render("andmeid/error", {error: {code: 401, message: "Unauthorized; Please login first"}})}
	if (!roles) {return next()} // Being logged in is required, no specific role is needed

	// Any of the roles specified in `roles` is needed
	let user_roles = []
	for (let i = 0; i < Object.keys(req.roles).length; i++) {
		if (Object.values(req.roles)[i]) {user_roles.push(Object.keys(req.roles)[i])}
	}
	for (let i = 0; i < user_roles.length; i++) {
		if (roles.indexOf(user_roles[i]) != -1) {return next()}
	}

	return req.method == "POST" ? res.status(403).json({status: false, error: `Unauthorized; You are not: ${roles}`})
	: res.status(403).render("andmeid/error", {error: {code: 403, message: `Unauthorized; You are not: ${roles}`}})
}

const home = require("../controllers/andmeid/home")
router.get("/", home.main)

const admin = require("../controllers/andmeid/admin")
router.get("/admin", admin.main) //(r,a,n)=>uc(r,a,n,["admin"]),
// Admin is currently a cool test area, I don't mind allowing folks to visit it for the time being

const matches = require("../controllers/andmeid/matches")
router.get("/matches", matches.main)
router.post("/matches", validator.id, matches.create)

const users = require("../controllers/andmeid/users")
router.get("/users", users.main)
router.get("/users/:id", users.specific)
router.post("/users", validator.id, users.find)

const games = require("../controllers/andmeid/games")
router.get("/games", games.main)
router.post("/games", validator.id, games.find)

const beatmaps = require("../controllers/andmeid/beatmaps")
router.get("/beatmaps", beatmaps.main)
router.post("/beatmaps", validator.id, beatmaps.find)

router.get("*", (req, res) => res.status(404).render("andmeid/error", {error: {code: 404, message: "The content you're looking for does not exist"}}))
router.post("*", (req, res) => res.status(404).json({status: false, error: "This route or content does not exist"}))

module.exports = router
