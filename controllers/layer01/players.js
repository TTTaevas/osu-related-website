const request = require("../../functions/osu-requests.js")

exports.home = async (req, res) => {
	let roles = await req.layer01.db.collection("roles").find().toArray()
	let players_roles = roles.filter((r) => {return r.roles.player})
	let players_roles_ids = players_roles.map((p) => {return p.id})
	let players = (await req.auth.users.array()).filter((p) => {return players_roles_ids.indexOf(p.id) >= 0})
	players = players.sort((a, b) => {return a.rank - b.rank}) // sort by rank
	res.status(200).render("layer01/players", {user: req.auth.user, roles: req.roles, players})
}

exports.update = async (req, res) => {
	let count = 0
	let token = await request.getToken()
	let users = await req.auth.users.array()
	for (let i = 0; i < users.length; i++) {
		let user_object = await request.getUser(token, users[i].id, "osu")
		let updated = {
			username: user_object.username,
			country: user_object.country_code,
			rank: user_object.statistics.global_rank,
			user_object: user_object
		}
		let update = await req.auth.users.collection.updateOne({id: users[i].id}, {$set: updated})
		if (update.modifiedCount) {count++}
	}

	console.log(`${count}/${users.length} users updated!`)
	res.redirect("/layer01/players")
}
