const v2 = require("../../../apis/osu-v2.js")

module.exports = async function insertMatches(history) {
	let token = false // Don't request token if no match to request

	for (let i = 0; i < history.tournaments.array.length; i++) {
		let matches_arr = []
		for (let e = 0; e < history.tournaments.array[i].matches.length; e++) {
			let match_id = history.tournaments.array[i].matches[e]
			let find = history.matches.array.find((match) => {return match.id == match_id})
			if (!find) {
				if (!token) {token = await v2.getToken()}
				if (!token) {return "Error; no token, cannot insertMatches"}
				let match = await v2.getMatch(token, match_id)
				if (match) {
					delete match.games // Storage in db is "limited"
					match.tournament = history.tournaments.array[i].name
					history.players.array = await playersArrHandler(match.players, history.players.array, match_id)
					for (let o = 0; o < match.players.length; o++) {match.players[o] = match.players[o].id}
					matches_arr.push(match)
				} else {console.log(`/!\\ ${history.tournaments.array[i].name}'s match ${match_id} was NOT found, consider removing it from the database\n`)}
			}
		}
		if (matches_arr.length) {await history.matches.collection.insertMany(matches_arr)}
	}

	if (history.players.array.length) {
		await history.players.collection.deleteMany()
		await history.players.collection.insertMany(history.players.array)
	}

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
