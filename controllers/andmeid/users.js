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
	res.status(200).render("andmeid/users", {user: req.auth.user})
}
