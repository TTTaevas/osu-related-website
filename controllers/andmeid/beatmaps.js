const v2 = require("../../apis/osu-v2.js")
const Branch = require("./classes/Branch.js")

const { addUser } = require("./users.js")

class Beatmap {
	constructor(b) {
		this.id = b.id
		this.set_id = b.beatmapset.id
		this.artist = b.beatmapset.artist
		this.title = b.beatmapset.title
		this.difficulty = b.version
		this.sr = {
			nm: b.difficulty_rating
		}
		this.mapper_id = b.user_id
		this.drain_length = new Date(b.hit_length * 1000).toISOString().substr(14, 5)
		this.total_length = new Date(b.total_length * 1000).toISOString().substr(14, 5)
	}
}

exports.addBeatmap = addBeatmap
async function addBeatmap(req, id, token, branch, guarantee) {
	if (branch) {branch = branch.add({id, type: "beatmap"})}

	let db_response = await req.andmeid.db.collection("beatmaps").findOne({id})
	if (db_response) return db_response

	if (!token) {token = await v2.getToken()}
	let osu_response = await v2.getBeatmap(token, id)
	if (!osu_response) return false

	let beatmap = new Beatmap(osu_response)
	insertBeatmap(req, beatmap, token, branch, guarantee)
	return beatmap
}

async function insertBeatmap(req, beatmap, token, branch, guarantee) {
	if (!guarantee) { // guarantee allows to bypass checks, making the insertion stuff faster
		let check = await req.andmeid.db.collection("games").find({beatmap: {id: beatmap.id, set_id: beatmap.set_id}}).toArray()
		if (!check.length) return
	}
	
	req.andmeid.db.collection("beatmaps").insertOne(beatmap)
	addUser(req, beatmap.mapper_id, token, branch, true)
}

exports.main = async (req, res) => {
	res.status(200).render("andmeid/main", {user: req.auth.user, type: "beatmaps"})
}

exports.specific = async (req, res) => {
	res.status(200).render("andmeid/specific", {user: req.auth.user, type: "beatmaps", id: req.params.id})
}

exports.find = async (req, res) => {
	let beatmap = await addBeatmap(req, req.body.id)
	let games = await req.andmeid.db.collection("games").find({beatmap: {id: beatmap.id, set_id: beatmap.set_id}}).toArray()
	beatmap.scores = games.map((g) => g.scores).flat()
	return res.status(beatmap ? 200 : 202).json({status: true, content: beatmap})
}
