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
async function addBeatmap(req, id, token, branch) {
	let info = {id, type: "beatmap"}
	let new_branch = branch ? branch.add(info) : new Branch(info, req.auth.user)

	let db_response = await req.andmeid.db.collection("beatmaps").findOne({id})
	if (db_response) return db_response

	if (!token) {token = await v2.getToken()}
	let osu_response = await v2.getBeatmap(token, id)
	if (!osu_response) return false

	let beatmap = new Beatmap(osu_response)
	let insertion = await req.andmeid.db.collection("beatmaps").insertOne(beatmap)

	addUser(req, beatmap.mapper_id, token, new_branch)

	return beatmap
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

	beatmaps.sort((x, y) => x.scores.length - y.scores.length).reverse()
	beatmaps.forEach((b) => b.scores.sort((x, y) => x.score - y.score).reverse())
	res.status(200).render("andmeid/beatmaps", {user: req.auth.user, beatmaps})
}

exports.create = async (req, res) => {
	let beatmap = await addBeatmap(req, req.body.id)
	let s = beatmap ? 200 : 202
	return res.status(s).json({status: true, content: beatmap})
}
