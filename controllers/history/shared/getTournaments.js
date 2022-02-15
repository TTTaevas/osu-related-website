require('dotenv').config()
const mongodb = require("mongodb").MongoClient

module.exports = async function getTournaments(category) {
	let client_uri = category == "referee" ? process.env.REF_CONNECTIONSTRING : process.env.PLA_CONNECTIONSTRING
	const client = new mongodb(client_uri)
	await client.connect()

	const db = client.db()
	const tournaments_collection = db.collection("tournaments")
	const tournaments = await tournaments_collection.find().toArray()
	const matches_collection = db.collection("matches")
	const matches = await matches_collection.find().toArray()
	const players_collection = db.collection("players")
	const players = await players_collection.find().toArray()
	await client.close()

	for (let i = 0; i < tournaments.length; i++) {
		let matches_arr = []

		for (let e = 0; e < tournaments[i].matches.length; e++) {
			let match_id = tournaments[i].matches[e]
			let match_find = matches.find((match) => {return match.id == match_id})

			if (match_find) {
				for (let o = 0; o < match_find.players.length; o++) {
					let player_id = match_find.players[o]
					let player_find = players.find((player) => {
						return player.id == player_id
					})

					if (player_find) {
						match_find.players[o] = player_find
					} else if (!(typeof player_id == "object" && player_id.id)) { // if id hasn't been replaced with player object already
						match_find.players[o] = {
							id: player_id,
							name: "NOT_FOUND",
							country_code: "AA",
							matches_played: {
								ids: match_id,
								count: 1
							}
						}
					}
				}
				matches_arr.push(match_find)
			}
		}

		tournaments[i].matches = matches_arr
	}

	tournaments.forEach((tournament, i) => {
		tournament.id = String(i)
		tournament.proper_date = properDate(tournament.date)
	})
	return tournaments
}

function properDate(date) {
	try {
		let proper = String(date.getUTCFullYear())
		let month = String(date.getUTCMonth() + 1)
		proper += `-${month.length < 2 ? "0" : ""}${Number(month)}`
		let day = String(date.getUTCDate())
		proper += `-${day.length < 2 ? "0" : ""}${day}`
		return proper
	} catch(e) {
		console.log("Could not use the properDate function on", date, e)
		return date
	}
}
