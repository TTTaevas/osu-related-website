const mongodb = require("mongodb").MongoClient
const request = require("./osu-requests.js")
const sanitize = require("./sanitizer.js")

module.exports = async function fetchMatchData(type) {
	let client_uri = type == "referee" ? process.env.REF_CONNECTIONSTRING : process.env.PLA_CONNECTIONSTRING
	const client = new mongodb(client_uri)
	await client.connect()

	const db = client.db()
	const tournaments_collection = db.collection("tournaments")
	const tournaments = await tournaments_collection.find().toArray()
	const matches_collection = db.collection("matches")
	const matches = await matches_collection.find().toArray()
	const players_collection = db.collection("players")
	let players = await players_collection.find().toArray()

	let token = false // If no match to request

	for (let i = 0; i < tournaments.length; i++) {

		while (!tournaments[i].matches) { // just in case:tm:
			let fix = {matches: []}
			let sanitized = sanitize(tournaments[i].name, "string")
			if (sanitized.pass) {
				await tournaments_collection.updateOne({name: sanitized.obj}, {$set: fix})
				console.log(`/!\\ ${tournaments[i].name} had to be skipped and fixed by fetchMatchData because false-y instead of array for matches\n`)
			}
			i++
		}

		let matches_arr = []
		
		for (let e = 0; e < tournaments[i].matches.length; e++) {
			let sanitized = sanitize(tournaments[i].matches[e], "id")
			if (sanitized.pass) {
				let match_id = sanitized.obj
				let find = matches.find((match) => {return match.id == match_id})
				if (!find) {
					if (!token) {token = await request.getToken()}
					if (!token) {
						await client.close()
						return "Error; no token, cannot fetchMatchData"
					}
					let match = await request.getMatch(token, match_id, tournaments[i].name)
					if (match) {
						players = await playersArrHandler(match.players, players, match_id)
						for (let o = 0; o < match.players.length; o++) {match.players[o] = match.players[o].id}
						matches_arr.push(match)
					} else {console.log(`/!\\ ${tournaments[i].name}'s match ${match_id} was NOT found, consider removing it from the database\n`)}
				}

			}
			
		}
		if (matches_arr.length) {await matches_collection.insertMany(matches_arr)}
	}

	if (players.length) {
		await players_collection.deleteMany()
		await players_collection.insertMany(players)
	}

	await client.close()
	return "Success"
}

function playersArrHandler(m_players, arr, match_id) {
	let new_arr = []

	for (let i = 0; i < m_players.length; i++) {
		let find = arr.find((player) => {return player.id == m_players[i].id})
		if (find) {
			// Add players from old array that WERE in this match into new array
			let ids = find.matches_played.ids
			ids.push(match_id)
			new_arr.push({
				id: find.id,
				name: find.name,
				country_code: find.country_code,
				matches_played: {
					ids: ids,
					count: find.matches_played.count + 1
				}
			})
		} else {
			// Add NEW players that WERE in this match into new array
			new_arr.push({
				id: m_players[i].id,
				name: m_players[i].username,
				country_code: m_players[i].country.code,
				matches_played: {
					ids: [match_id],
					count: 1
				}
			})
		}
	}

	for (let i = 0; i < arr.length; i++) {
		// Add players from old array that WEREN'T in this match into the new array
		let find = new_arr.find((player) => {return player.id == arr[i].id})
		if (!find) {new_arr.push(arr[i])}
	}
	
	return new_arr
}
