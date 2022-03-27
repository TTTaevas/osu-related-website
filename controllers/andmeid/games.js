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
	games = await Promise.all(await games.filter(async (game) => {
		await !req.andmeid.db.collection("games").findOne({id: game.id})
	}))
	await req.andmeid.db.collection("games").insertMany(games)

	games.forEach((g) => addBeatmap(req, g.beatmap.id, token, new_branch))
}

exports.main = async (req, res) => {
	res.status(200).render("andmeid/games", {user: req.auth.user})
}
