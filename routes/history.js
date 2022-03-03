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

router.all("/:type*", async (req, res, next) => {
	let prefix = req.params.type == "referee" ? "r_" : req.params.type == "player" ? "p_" : undefined

	if (prefix) {
		req.history.tournaments.collection = req.history.db.collection(`${prefix}tournaments`)
		req.history.matches.collection = req.history.db.collection(`${prefix}matches`)
		req.history.players.collection = req.history.db.collection(`${prefix}players`)
		
		await Promise.all([
			req.history.tournaments.array = await req.history.db.collection(`${prefix}tournaments`).find().toArray(),
			req.history.matches.array = await req.history.db.collection(`${prefix}matches`).find().toArray(),
			req.history.players.array = await req.history.db.collection(`${prefix}players`).find().toArray()
		])
	}

	next()
})

const root = require("../controllers/history/root")
router.get("/", root.home)

const referee = require("../controllers/history/referee")
router.get("/referee", referee.home)
router.post("/referee/*", (req, res, next) => {
	if (!req.auth.user || !req.auth.user.roles.admin) {return res.status(403).send("Unauthorized; not an admin")}
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
