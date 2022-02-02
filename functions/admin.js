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

async function addMatch(id, match_col) {
	// the data of a match will be stored within a dedicated collection
	let token = await request.getToken()
	let match = await request.getMatch(token, id)
	for (let i = 0; i < match.games.length; i++) {
		for (let e = 0; e < match.games[i].scores.length; e++) {
			let mods = match.games[i].scores[e].mods
			if (mods.includes("HD") && (mods.includes("HR") || mods.includes("DT"))) {
				match.games[i].scores[e].score = Math.round(match.games[i].scores[e].score / 1.06)
			}
		}
	}
	await match_col.insertOne(match)
	console.log(`${match.name} now in the collection!`)
	return "yes"
}

module.exports = {
	updatePlayers,
	addMatch
}
