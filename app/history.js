const express = require("express")
const router = express.Router()

const client = require("../database.js")
const userCheck = require("../functions/user-check.js")

const tournamentsHandle = require("../functions/tournaments-handle.js")
const referee = require("../functions/referee.js")

router.get("/", async (req, res) => {
	let check = await userCheck(client, req.session.user)
	res.status(200).render("history/home", {user: check.user})
})

router.get("/referee", async (req, res) => {
	let check = await userCheck(client, req.session.user)
	let tournaments = await tournamentsHandle("referee")
	res.render("history/referee", {user: check.user, tournaments: tournaments})
})

router.post("/referee/:action", async(req, res) => {
	let check = await userCheck(client, req.session.user, "admin")
	if (!check.authorized) {return res.status(401).send("Unauthorized; not an admin")}

	switch(req.params.action) {
		case "add": await referee.addTournament(req.body, req.files, res); break;
		case "remove": await referee.removeTournament(req.body, res); break;
		case "import": await referee.importTournament(req.files, res); break;
		case "addMatches": await referee.addMatches(req.body, res); break;
		default: return res.status(404).send("Action not found"); break;
	}
})

router.get("/player", async (req, res) => {res.render("history/player")})

router.get("/*", (req, res) => {
	res.status(404).render("history/fourofour")
})


module.exports = router
