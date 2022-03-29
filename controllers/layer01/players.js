const v2 = require("../../apis/osu-v2.js")

exports.main = async (req, res) => {
	let roles = await req.layer01.db.collection("roles").find().toArray()
	let players_roles = roles.filter((r) => {return r.roles.player})
	let players_roles_ids = players_roles.map((p) => {return p.id})
	let players = (await req.auth.users.array()).filter((p) => {return players_roles_ids.indexOf(p.id) >= 0})
	players = players.sort((a, b) => {return a.rank - b.rank}) // sort by rank
	res.status(200).render("layer01/players", {user: req.auth.user, roles: req.roles, players})
}

exports.update = async (req, res) => {
	let count = 0
	let token = await v2.getToken()
	let users = await req.auth.users.array()
	for (let i = 0; i < users.length; i++) {
		let user_object = await v2.getUser(token, users[i].id, "osu")
		let updated = {
			username: user_object.username,
			country: user_object.country_code,
			rank: user_object.statistics.global_rank
		}
		let update = await req.auth.users.collection.updateOne({id: users[i].id}, {$set: updated})
		if (update.modifiedCount) {count++}
	}

	console.log(`${count}/${users.length} users updated!`)
	res.redirect("/layer01/players")
}
