const express = require("express")
const router = express.Router()
const end_of_tourney = new Date(Date.UTC(2022, 3, 13))

const { layer01 } = require("../db-clients.js")
require("./roles/assign.js")(router, layer01, "layer01")
const validator = require("./validators/layer01.js")
const check = require("./roles/check.js")

router.post("*", (req, res, next) => {
	new Date() > end_of_tourney ?
	res.status(403).render("layer01/error", {error: {code: 403, message: "Tournament has ended!"}}) :
	next()
})


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
router.post("/playlists", (r,a,n)=>check(r,a,n,["admin"]), validator.createPlaylist, playlists.create)

const playerRegistration = require("../controllers/layer01/player-registration")
router.get("/player-registration", playerRegistration.main)
router.post("/player-registration", (r,a,n)=>check(r,a,n), validator.createPlayer, playerRegistration.create)

const players = require("../controllers/layer01/players")
router.get("/players", players.main)
router.post("/players", (r,a,n)=>check(r,a,n,["admin"]), players.update)

const staffRegistration = require("../controllers/layer01/staff-registration")
router.get("/staff-registration", staffRegistration.main)
router.post("/staff-registration", (r,a,n)=>check(r,a,n), validator.staffReg, staffRegistration.update)

const staffRegs = require("../controllers/layer01/staff-regs")
router.get("/staff-regs", (r,a,n)=>check(r,a,n,["admin"]), staffRegs.main)
router.post("/staff-regs", (r,a,n)=>check(r,a,n,["admin"]), validator.addStaff, staffRegs.update)

const referee = require("../controllers/layer01/referee")
router.get("/referee", (r,a,n)=>check(r,a,n,["referee"]), referee.main)

const qualifiers = require("../controllers/layer01/qualifiers")
router.get("/qualifiers", qualifiers.main)
router.post("/qualifiers/create", (r,a,n)=>check(r,a,n,["admin"]), validator.qualsCreate, qualifiers.create)
router.post("/qualifiers/join", (r,a,n)=>check(r,a,n,["player"]), validator.qualsJoin, qualifiers.join)
router.post("/qualifiers/referee/add", (r,a,n)=>check(r,a,n,["referee"]), validator.qualsRef, qualifiers.referee_add)
router.post("/qualifiers/referee/remove", (r,a,n)=>check(r,a,n,["referee"]), validator.qualsRef, qualifiers.referee_remove)

const qualifiersResults = require("../controllers/layer01/qualifiers-results")
router.get("/qualifiers-results", qualifiersResults.main)
router.post("/qualifiers-results", (r,a,n)=>check(r,a,n,["admin"]), validator.qualsResults, qualifiersResults.create)

const matches = require("../controllers/layer01/matches")
router.get("/matches", matches.main)
router.post("/matches/create", (r,a,n)=>check(r,a,n,["admin"]), validator.matchCreate, matches.create)
router.post("/matches/staff/add", (r,a,n)=>check(r,a,n,["referee","streamer","commentator"]), validator.matchStaff, matches.staff_add)
router.post("/matches/staff/remove", (r,a,n)=>check(r,a,n,["referee","streamer","commentator"]), validator.matchStaff, matches.staff_remove)

router.get("*", (req, res) => res.status(404).render("layer01/error", {error: {code: 404, message: "This part of the website does not exist"}}))
router.post("*", (req, res) => res.status(404).json({status: false, error: "This part of the website does not exist"}))

module.exports = router
