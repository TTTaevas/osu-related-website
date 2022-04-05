const v2 = require("../../apis/osu-v2.js")
const Branch = require("./classes/Branch.js")

class User { // login.js line 64 or so
	constructor(u) {
		this.id = u.id
		this.username = u.username
		this.avatar = u.avatar_url
		this.country = u.country_code
		this.rank = u.statistics.global_rank
		this.discord = u.discord
		this.timezone = null
		this.login_count = 0
	}
}

exports.addUser = addUser
async function addUser(req, id, token, branch) {
	let info = {id, type: "user"}
	let new_branch = branch ? branch.add(info) : new Branch(info, req.auth.user)

	let db_response = await req.auth.users.collection.findOne({id})
	if (db_response) return db_response

	if (!token) {token = await v2.getToken()}
	let osu_response = await v2.getUser(token, id, "osu")
	if (!osu_response) return false

	let user = new User(osu_response)
	let insertion = await req.auth.users.collection.insertOne(user)
	
	return user
}

exports.main = async (req, res) => {
	let u_db = await req.auth.users.array()
	let users = await Promise.all(await u_db.map(async (u) => {
		u.mapped = await req.andmeid.db.collection("beatmaps").find({mapper_id: u.id}).toArray()
		u.matches = await req.andmeid.db.collection("matches").find({players: {$elemMatch: {id: u.id}}}).toArray()
		// u.matches = await Promise.all(u.matches.map(async (m) => {
		// 	m.games = await Promise.all(m.games.map(async (g) => g = await req.andmeid.db.collection("games").findOne({id: g})))
		// 	return m
		// }))
		// const util = require('util')
		// if (u.mapped.length) console.log(util.inspect(u, false, null, true))
		
		return u
	}))
	
	users.sort((x, y) => {
		if (x.matches.length != y.matches.length) {return y.matches.length - x.matches.length}
		if (x.mapped.length != y.mapped.length) {return y.mapped.length - x.mapped.length}
		return x.username > y.username ? 1 : -1	
	})
	res.status(200).render("andmeid/users", {user: req.auth.user, users})
}
