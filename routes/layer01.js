const express = require("express")
const router = express.Router()

const { layer01 } = require("../db-clients.js")
router.all("*", (req, res, next) => {
	req.layer01 = {
		client: layer01,
		db: layer01.db()
	}
	next()
})

// Might wanna migrate that to ../functions
const uc = function(req, res, next, roles) {
	if (!req.auth.user) {return res.status(401).render("layer01/error", {status: {code: 401, reason: "Unauthorized; Please login first"}})}
	if (!roles) {return next()} // Being logged in is required, no specific role is needed

	// Any of the roles specified in `roles` is needed
	let user_roles = []
	for (let i = 0; i < Object.keys(req.auth.user.roles).length; i++) {
		if (Object.values(req.auth.user.roles)[i]) {user_roles.push(Object.keys(req.auth.user.roles)[i])}
	}
	for (let i = 0; i < user_roles.length; i++) {
		if (roles.indexOf(user_roles[i]) != -1) {return next()}
	}

	return res.status(403).render("layer01/error", {status: {code: 403, reason: `Unauthorized; You are not: ${roles}`}})
}

const root = require("../controllers/layer01/root")
router.get("/", root.home)

const login = require("../controllers/layer01/login")
router.get("/login", login.home)

const rules = require("../controllers/layer01/rules")
router.get("/rules", rules.home)

const playlists = require("../controllers/layer01/playlists")
router.get("/playlists", playlists.home)
router.post("/playlists", (r,a,n)=>uc(r,a,n,["admin"]), playlists.create)

const playerRegistration = require("../controllers/layer01/player-registration")
router.get("/player-registration", playerRegistration.home)
router.post("/player-registration", (r,a,n)=>uc(r,a,n), playerRegistration.create)

const players = require("../controllers/layer01/players")
router.get("/players", players.home)
router.post("/players", (r,a,n)=>uc(r,a,n,["admin"]), players.update)

const staffRegistration = require("../controllers/layer01/staff-registration")
router.get("/staff-registration", staffRegistration.home)
router.post("/staff-registration", (r,a,n)=>uc(r,a,n), staffRegistration.update)

const staffRegs = require("../controllers/layer01/staff-regs")
router.get("/staff-regs", (r,a,n)=>uc(r,a,n,["admin"]), staffRegs.home)
router.post("/staff-regs", (r,a,n)=>uc(r,a,n,["admin"]), staffRegs.update)

const referee = require("../controllers/layer01/referee")
router.get("/referee", (r,a,n)=>uc(r,a,n,["referee"]), referee.home)

const qualifiers = require("../controllers/layer01/qualifiers")
router.get("/qualifiers", qualifiers.home)
router.post("/qualifiers/create", (r,a,n)=>uc(r,a,n,["admin"]), qualifiers.create)
router.post("/qualifiers/join", (r,a,n)=>uc(r,a,n,["player"]), qualifiers.join)
router.post("/qualifiers/referee/add", (r,a,n)=>uc(r,a,n,["referee"]), qualifiers.referee_add)
router.post("/qualifiers/referee/remove", (r,a,n)=>uc(r,a,n,["referee"]), qualifiers.referee_remove)

const qualifiersResults = require("../controllers/layer01/qualifiers-results")
router.get("/qualifiers-results", qualifiersResults.home)
router.post("/qualifiers-results", (r,a,n)=>uc(r,a,n,["admin"]), qualifiersResults.create)

const matches = require("../controllers/layer01/matches")
router.get("/matches", matches.home)
router.post("/matches/create", (r,a,n)=>uc(r,a,n,["admin"]), matches.create)
router.post("/matches/staff/add", (r,a,n)=>uc(r,a,n,["referee","streamer","commentator"]), matches.staff_add)
router.post("/matches/staff/remove", (r,a,n)=>uc(r,a,n,["referee","streamer","commentator"]), matches.staff_remove)

router.get("/*", (req, res) => {
	res.status(404).render("layer01/error", {status: {code: 404, reason: "This part of the website does not exist"}})
})

module.exports = router
