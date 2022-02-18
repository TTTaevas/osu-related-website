const client = require("../../database.js")
const userCheck = require("../../functions/user-check.js")

const request = require("../../functions/osu-requests.js")

exports.home = async (req, res) => {
	let check = await userCheck(client, req.session.user)
	let players = check.users.filter((user) => {return user.roles.player})
	players = players.sort((a, b) => {return a.rank - b.rank}) // sort by rank
	res.status(200).render("layer01/players", {user: check.user, players: players})
}

exports.update = async (req, res) => {
	let check = await userCheck(client, req.session.user, "admin")
	if (!check.authorized) {return res.status(403).render("layer01/error", {status: {code: 403, reason: "Unauthorized; you shouldn't be there :3c"}})}
	
	let token = await request.getToken()
	for (let i = 0; i < check.users.length; i++) {
		let user_object = await request.getUser(token, check.users[i].id, "osu")
		let updated = {
			username: user_object.username,
			country: user_object.country_code,
			rank: user_object.statistics.global_rank,
			user_object: user_object
		}
		await check.collection.updateOne({id: check.users[i].id}, {$set: updated})
	}

	console.log(`${check.users.length} users updated!`)
	res.redirect("/layer01/players")
}
