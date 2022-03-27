const v2 = require("../../apis/osu-v2.js")
const Root = require("./classes/Root.js")

const { addBeatmap } = require("./beatmaps.js")

class Match {
	constructor(m) {
		this.id = m.id
		this.name = m.name
		this.date = m.date
		this.games = m.players
		this.games = m.games.map((g) => g.id)
	}
}

exports.addMatch = addMatch
async function addMatch(req, id, token, root) {
	let info = {type: "match", id}
	root ? root.add(info) : root = new Root(req.auth.user, info)

	let db_response = await req.andmeid.db.collection("matches").findOne({id})
	if (db_response) {
		root.log()
		return db_response
	}

	if (!token) {token = await v2.getToken()}
	let osu_response = await v2.getMatch(token, id)
	if (!osu_response) return false

	let match = new Match(osu_response)
	let insertion = await req.andmeid.db.collection("matches").insertOne(match)
	
	for (let i = 0; i < osu_response.games.length; i++) {
		let beatmap_id = osu_response.games[i].beatmap.id
		setTimeout(() => addBeatmap(req, beatmap_id, token, root), 200 * i)
	}

	return match
}

exports.main = async (req, res) => {
	res.status(200).render("andmeid/matches", {user: req.auth.user})
}

exports.create = async (req, res) => {
	let match = await addMatch(req, req.body.id)
	let s = match ? 200 : 202
	return res.status(s).json({status: true, content: match})
}
