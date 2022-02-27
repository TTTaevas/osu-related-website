const express = require("express")
const router = express.Router()

const { history } = require("../db-clients.js")
router.all("*", (req, res, next) => {
	req.history = {
		client: history,
		db: history.db(),
		tournaments: {
			collection: undefined,
			array: undefined
		},
		matches: {
			collection: undefined,
			array: undefined
		},
		players: {
			collection: undefined,
			array: undefined
		}
	}
	next()
})

router.all("/referee*", async (req, res, next) => {
	req.history.tournaments.collection = req.history.db.collection("tournaments")
	req.history.matches.collection = req.history.db.collection("matches")
	req.history.players.collection = req.history.db.collection("players")
	
	await Promise.all([
		req.history.tournaments.array = await req.history.db.collection("tournaments").find().toArray(),
		req.history.matches.array = await req.history.db.collection("matches").find().toArray(),
		req.history.players.array = await req.history.db.collection("players").find().toArray()
	])

	next()
})

const root = require("../controllers/history/root")
router.get("/", root.home)

const referee = require("../controllers/history/referee")
router.get("/referee", referee.home)
router.post("/referee/*", (req, res, next) => {
	if (!req.user || !req.user.roles.admin) {return res.status(403).send("Unauthorized; not an admin")}
	next()
})
router.post("/referee/add", referee.add)
router.post("/referee/addMatches", referee.addMatches)
router.post("/referee/remove", referee.remove)
router.post("/referee/import", referee.import)

const player = require("../controllers/history/player")
router.get("/player", player.home)

router.get("/*", (req, res) => {
	res.status(404).render("history/fourofour")
})

module.exports = router
