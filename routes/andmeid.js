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
	if (!req.auth.user) {return res.status(401).render("andmeid/error", {error: {code: 401, message: "Unauthorized; Please login first"}})}
	if (!roles) {return next()} // Being logged in is required, no specific role is needed

	// Any of the roles specified in `roles` is needed
	let user_roles = []
	for (let i = 0; i < Object.keys(req.roles).length; i++) {
		if (Object.values(req.roles)[i]) {user_roles.push(Object.keys(req.roles)[i])}
	}
	for (let i = 0; i < user_roles.length; i++) {
		if (roles.indexOf(user_roles[i]) != -1) {return next()}
	}

	return res.status(403).render("andmeid/error", {error: {code: 403, message: `Unauthorized; You are not: ${roles}`}})
}

const home = require("../controllers/andmeid/home")
router.get("/", home.main)

// The admin requirement is temporary
const matches = require("../controllers/andmeid/matches")
router.get("/matches", matches.main)
router.post("/matches", (r,a,n)=>uc(r,a,n,["admin"]), validator.id, matches.create)

const beatmaps = require("../controllers/andmeid/beatmaps")
router.get("/beatmaps", matches.main)
router.post("/beatmaps", (r,a,n)=>uc(r,a,n,["admin"]), validator.id, beatmaps.create)

router.use((req, res) => res.status(404).render("andmeid/error", {error: {code: 404, message: "The content you're looking for does not exist"}}))

module.exports = router
