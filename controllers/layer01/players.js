const request = require("../../functions/osu-requests.js")

exports.home = async (req, res) => {
	let players = req.users.filter((user) => {return user.roles.player})
	players = players.sort((a, b) => {return a.rank - b.rank}) // sort by rank
	res.status(200).render("layer01/players", {user: req.user, players: players})
}

exports.update = async (req, res) => {
	let count = 0
	let token = await request.getToken()
	for (let i = 0; i < req.users.length; i++) {
		let user_object = await request.getUser(token, req.users[i].id, "osu")
		let updated = {
			username: user_object.username,
			country: user_object.country_code,
			rank: user_object.statistics.global_rank,
			user_object: user_object
		}
		let update = await req.collection.updateOne({id: req.users[i].id}, {$set: updated})
		if (update.modifiedCount) {count++}
	}

	console.log(`${count}/${req.users.length} users updated!`)
	res.redirect("/layer01/players")
}
