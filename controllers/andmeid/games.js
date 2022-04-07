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
	let info = {ids: games.map((g) => g.id), type: "games"}
	let new_branch = branch ? branch.add(info) : new Branch(info, req.auth.user)

	games = games.map((g) => new Game(g))
	let checks = await Promise.all(games.map((g) => req.andmeid.db.collection("games").findOne({id: g.id})))
	games = games.filter((g, i) => !Boolean(checks[i]))
	if (games.length) await req.andmeid.db.collection("games").insertMany(games) // Empty arrays are NOT supported lmfao

	games.forEach((g) => addBeatmap(req, g.beatmap.id, token, new_branch, true))
}

exports.findGame = findGame
async function findGame(req, id, branch) {
	let info = {id, type: "games"}
	branch ? branch.add(info) : new Branch(info, req.auth.user)
	return await req.andmeid.db.collection("games").findOne({id})
}

exports.main = async (req, res) => {
	res.status(204).render("andmeid/games", {user: req.auth.user})
}

exports.find = async (req, res) => {
	let game = await findGame(req, req.body.id)
	return res.status(game ? 200 : 202).json({status: true, content: game})
}
