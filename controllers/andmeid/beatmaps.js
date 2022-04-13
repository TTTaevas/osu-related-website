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
	/*  Insert functions exist because it's fine to use Andmeid's API to easily use osu!api v2
		But it's not fine to use Andmeid's API to fill its database with stuff the website doesn't use  */

	if (!guarantee) { // guarantee allows to bypass checks, making the insertion stuff faster
		let check = await req.andmeid.db.collection("games").find({beatmap: {$elemMatch: {id: beatmap.id}}}).toArray()
		if (!check) return
	}
	
	req.andmeid.db.collection("beatmaps").insertOne(beatmap)
	addUser(req, beatmap.mapper_id, token, branch, true)
}

exports.main = async (req, res) => {
	let b_db = await req.andmeid.db.collection("beatmaps").find().toArray()
	let beatmaps = await Promise.all(await b_db.map(async (b) => {
		b.mapper = await req.auth.users.collection.findOne({id: b.mapper_id})

		let games = await req.andmeid.db.collection("games").find({"beatmap.id": b.id}).toArray()
		b.scores = await Promise.all(games.map((g) => g.scores.map(async (s) => {
			s.player = await req.auth.users.collection.findOne({id: s.player_id})
			return s
		}))
		.flat())
		
		return b
	}))

	beatmaps.sort((x, y) => y.scores.length - x.scores.length)
	beatmaps.forEach((b) => b.scores.sort((x, y) => y.score - x.score))
	res.status(200).render("andmeid/beatmaps", {user: req.auth.user, beatmaps})
}

exports.find = async (req, res) => {
	let beatmap = await addBeatmap(req, req.body.id)
	return res.status(beatmap ? 200 : 202).json({status: true, content: beatmap})
}
