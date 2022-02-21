const express = require("express")
const router = express.Router()

const root = require("../controllers/layer01/root")
router.get("/", root.home)

const login = require("../controllers/layer01/login")
router.get("/login", login.home)

const rules = require("../controllers/layer01/rules")
router.get("/rules", rules.home)

const playlists = require("../controllers/layer01/playlists")
router.get("/playlists", playlists.home)
router.post("/playlists", playlists.create)

const playerRegistration = require("../controllers/layer01/player-registration")
router.get("/player-registration", playerRegistration.home)
router.post("/player-registration", playerRegistration.create)

const players = require("../controllers/layer01/players")
router.get("/players", players.home)
router.post("/players", players.update)

const staffRegistration = require("../controllers/layer01/staff-registration")
router.get("/staff-registration", staffRegistration.home)
router.post("/staff-registration", staffRegistration.update)

const staffRegs = require("../controllers/layer01/staff-regs")
router.get("/staff-regs", staffRegs.home)
router.post("/staff-regs", staffRegs.update)

const referee = require("../controllers/layer01/referee")
router.get("/referee", referee.home)

const qualifiers = require("../controllers/layer01/qualifiers")
router.get("/qualifiers", qualifiers.home)
router.post("/qualifiers/create", qualifiers.create)
router.post("/qualifiers/join", qualifiers.join)
router.post("/qualifiers/referee/add", qualifiers.referee_add)
router.post("/qualifiers/referee/remove", qualifiers.referee_remove)

const qualifiersResults = require("../controllers/layer01/qualifiers-results")
router.get("/qualifiers-results", qualifiersResults.home)
router.post("/qualifiers-results", qualifiersResults.create)

const matches = require("../controllers/layer01/matches")
router.get("/matches", matches.home)
router.post("/matches", matches.update) // Need to rework that

router.get("/*", (req, res) => {
	res.status(404).render("layer01/fourofour")
})

module.exports = router
