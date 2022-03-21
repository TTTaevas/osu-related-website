const express = require("express")
const router = express.Router()
const end_of_tourney = new Date(Date.UTC(2022, 3, 13))

const { layer01 } = require("../db-clients.js")
const validator = require("../validators/layer01.js")

router.all("*", async (req, res, next) => {
	req.layer01 = {
		client: layer01,
		db: layer01.db()
	}

	let roles = {}
	if (req.auth.user) {
		let found_roles = await req.layer01.db.collection("roles").findOne({id: req.auth.user.id})
		if (found_roles) {roles = found_roles.roles}
	}
	req.roles = roles

	next()
})

// A similar function may end up being required in some other part of the website; keep it in mind
const uc = function(req, res, next, roles) {
	let time_now = new Date()
	if (time_now > end_of_tourney) {return res.status(403).render("layer01/error", {status: {code: 403, reason: "Tournament has ended!"}})}

	if (!req.auth.user) {return res.status(401).render("layer01/error", {status: {code: 401, reason: "Unauthorized; Please login first"}})}
	if (!roles) {return next()} // Being logged in is required, no specific role is needed

	// Any of the roles specified in `roles` is needed
	let user_roles = []
	for (let i = 0; i < Object.keys(req.roles).length; i++) {
		if (Object.values(req.roles)[i]) {user_roles.push(Object.keys(req.roles)[i])}
	}
	for (let i = 0; i < user_roles.length; i++) {
		if (roles.indexOf(user_roles[i]) != -1) {return next()}
	}

	return res.status(403).render("layer01/error", {status: {code: 403, reason: `Unauthorized; You are not: ${roles}`}})
}

const home = require("../controllers/layer01/home")
router.get("/", home.main)

// Legacy login system was through LAYER01, now redirect to the current system at root
router.get("/login", (req, res) => {
	res.redirect(308, `../login${req.query.code ? "?code=" + req.query.code : ""}`)
})

const rules = require("../controllers/layer01/rules")
router.get("/rules", rules.main)

const playlists = require("../controllers/layer01/playlists")
router.get("/playlists", playlists.main)
router.post("/playlists", (r,a,n)=>uc(r,a,n,["admin"]), validator.createPlaylist, playlists.create)

const playerRegistration = require("../controllers/layer01/player-registration")
router.get("/player-registration", playerRegistration.main)
router.post("/player-registration", (r,a,n)=>uc(r,a,n), validator.createPlayer, playerRegistration.create)

const players = require("../controllers/layer01/players")
router.get("/players", players.main)
router.post("/players", (r,a,n)=>uc(r,a,n,["admin"]), players.update)

const staffRegistration = require("../controllers/layer01/staff-registration")
router.get("/staff-registration", staffRegistration.main)
router.post("/staff-registration", (r,a,n)=>uc(r,a,n), validator.staffReg, staffRegistration.update)

const staffRegs = require("../controllers/layer01/staff-regs")
router.get("/staff-regs", (r,a,n)=>uc(r,a,n,["admin"]), staffRegs.main)
router.post("/staff-regs", (r,a,n)=>uc(r,a,n,["admin"]), validator.addStaff, staffRegs.update)

const referee = require("../controllers/layer01/referee")
router.get("/referee", (r,a,n)=>uc(r,a,n,["referee"]), referee.main)

const qualifiers = require("../controllers/layer01/qualifiers")
router.get("/qualifiers", qualifiers.main)
router.post("/qualifiers/create", (r,a,n)=>uc(r,a,n,["admin"]), validator.qualsCreate, qualifiers.create)
router.post("/qualifiers/join", (r,a,n)=>uc(r,a,n,["player"]), validator.qualsJoin, qualifiers.join)
router.post("/qualifiers/referee/add", (r,a,n)=>uc(r,a,n,["referee"]), validator.qualsRef, qualifiers.referee_add)
router.post("/qualifiers/referee/remove", (r,a,n)=>uc(r,a,n,["referee"]), validator.qualsRef, qualifiers.referee_remove)

const qualifiersResults = require("../controllers/layer01/qualifiers-results")
router.get("/qualifiers-results", qualifiersResults.main)
router.post("/qualifiers-results", (r,a,n)=>uc(r,a,n,["admin"]), validator.qualsResults, qualifiersResults.create)

const matches = require("../controllers/layer01/matches")
router.get("/matches", matches.main)
router.post("/matches/create", (r,a,n)=>uc(r,a,n,["admin"]), validator.matchCreate, matches.create)
router.post("/matches/staff/add", (r,a,n)=>uc(r,a,n,["referee","streamer","commentator"]), validator.matchStaff, matches.staff_add)
router.post("/matches/staff/remove", (r,a,n)=>uc(r,a,n,["referee","streamer","commentator"]), validator.matchStaff, matches.staff_remove)

router.get("/*", (req, res) => {
	res.status(404).render("layer01/error", {status: {code: 404, reason: "This part of the website does not exist"}})
})

module.exports = router
