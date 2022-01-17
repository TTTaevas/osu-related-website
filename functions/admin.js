const request = require("./osu-requests.js")

async function updatePlayers(users, users_col) {
	let token = await request.getToken()
	for (let i = 0; i < users.length; i++) {
		let user_object = await request.getUser(token, users[i].id, "osu")
		let updated = {
			username: user_object.username,
			country: user_object.country_code,
			rank: user_object.statistics.global_rank,
			user_object: user_object
		}
		await users_col.updateOne({id: users[i].id}, {$set: updated})
	}
	console.log(`${users.length} users updated!`)
	return "updatePlayers finished"
}

module.exports = {
	updatePlayers
}
