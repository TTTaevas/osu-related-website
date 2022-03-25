const express = require("express")
const router = express.Router()

const { history } = require("../db-clients.js")
const validator = require("./validators/history.js")

router.all("*", async (req, res, next) => {
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

	let roles = {}
	if (req.auth.user) {
		let found_roles = await req.history.db.collection(`roles`).findOne({id: req.auth.user.id})
		if (found_roles) {roles = found_roles.roles}
	}
	req.roles = roles
	
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

		req.history.tournaments.array = req.history.tournaments.array.sort((a, b) => {return Number(a.date) - Number(b.date)})
	}

	next()
})

const home = require("../controllers/history/home")
router.get("/", home.main)

const referee = require("../controllers/history/referee")
router.get("/referee", referee.main)
router.post("/referee/*", (req, res, next) => {
	if (!req.roles.admin) {return res.status(403).send("Unauthorized; not an admin")}
	next()
})
router.post("/referee/add", validator.addTournaments, referee.add)
router.post("/referee/addMatches", validator.addMatches, referee.addMatches)
router.post("/referee/remove", validator.removeTournaments, referee.remove)
router.post("/referee/import", referee.import)

const player = require("../controllers/history/player")
router.get("/player", player.main)

router.get("/*", (req, res) => {
	res.status(404).render("history/fourofour")
})

module.exports = router
