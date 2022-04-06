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
async function addUser(req, id, token, branch, guarantee) {
	let info = {id, type: "user"}
	let new_branch = branch ? branch.add(info) : new Branch(info, req.auth.user)

	let db_response = await req.auth.users.collection.findOne({id})
	if (db_response) return db_response

	if (!token) {token = await v2.getToken()}
	let osu_response = await v2.getUser(token, id, "osu")
	if (!osu_response) return false

	let user = new User(osu_response)
	insertUser(req, user, token, new_branch, guarantee)
	return user
}

async function insertUser(req, user, token, branch, guarantee) {
	/*  Insert functions exist because it's fine to use Andmeid's API to easily use osu!api v2
		But it's not fine to use Andmeid's API to fill its database with stuff the website doesn't use  */

	if (!guarantee) { // guarantee allows to bypass checks, making the insertion stuff faster
		let check = await Promise.all([
			req.andmeid.db.collection("beatmaps").find({mapper_id: user.id}).toArray(),
			req.andmeid.db.collection("matches").find({players: {$elemMatch: {id: user.id}}}).toArray()
		])
		if (check.every((c) => !c.length)) return
	}
	
	req.auth.users.collection.insertOne(user)
}

exports.main = async (req, res) => {
	let u_db = await req.auth.users.array()
	let users = await Promise.all(await u_db.map(async (u) => {
		u.mapped = await req.andmeid.db.collection("beatmaps").find({mapper_id: u.id}).toArray()
		u.matches = await req.andmeid.db.collection("matches").find({players: {$elemMatch: {id: u.id}}}).toArray()
		return u
	}))
	
	users.sort((x, y) => {
		if (x.matches.length != y.matches.length) {return y.matches.length - x.matches.length}
		if (x.mapped.length != y.mapped.length) {return y.mapped.length - x.mapped.length}
		return x.username > y.username ? 1 : -1	
	})
	res.status(200).render("andmeid/users", {user: req.auth.user, users})
}

exports.find = async (req, res) => {
	let user = await addUser(req, req.body.id)
	return res.status(user ? 200 : 202).json({status: true, content: user})
}
