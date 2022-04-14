const Branch = require("./classes/Branch.js")

const { addBeatmap } = require("./beatmaps.js")

class Game {
	constructor(g) {
		this.id = g.id
		this.date = new Date(g.end_time)
		this.scoring_type = g.scoring_type
		this.team_type = g.team_type
		this.mode_int = g.mode_int
		this.beatmap = g.beatmap
		this.mods = g.mods
		this.scores = g.scores
	}
}

exports.addGames = addGames
async function addGames(req, games, token, branch) {
	if (branch) {branch = branch.add({ids: games.map((g) => g.id), type: "games"})}

	games = games.map((g) => new Game(g))
	let checks = await Promise.all(games.map((g) => req.andmeid.db.collection("games").findOne({id: g.id})))
	games = games.filter((g, i) => !Boolean(checks[i]))
	if (games.length) await req.andmeid.db.collection("games").insertMany(games) // Empty arrays are NOT supported lmfao

	games.forEach((g) => addBeatmap(req, g.beatmap.id, token, branch, true))
}

exports.findGame = findGame
async function findGame(req, id, branch) {
	if (branch) {branch = branch.add({id, type: "games"})}
	return await req.andmeid.db.collection("games").findOne({id})
}

exports.main = async (req, res) => {
	res.status(200).render("andmeid/main", {user: req.auth.user, type: "games"})
}

exports.specific = async (req, res) => {
	res.status(200).render("andmeid/specific", {user: req.auth.user, type: "games", id: req.params.id})
}

exports.find = async (req, res) => {
	let game = await findGame(req, req.body.id)
	return res.status(game ? 200 : 202).json({status: true, content: game})
}
