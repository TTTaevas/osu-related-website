module.exports = async function getTournaments(history) {
	for (let i = 0; i < history.tournaments.array.length; i++) {
		let tournament = history.tournaments.array[i]
		let matches_arr = []

		for (let e = 0; e < tournament.matches.length; e++) {
			let match_id = tournament.matches[e]
			let match_find = history.matches.array.find((match) => {return match.id == match_id})

			if (match_find) {
				for (let o = 0; o < match_find.players.length; o++) {
					let player_id = match_find.players[o]
					let player_find = history.players.array.find((player) => {
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

		history.tournaments.array[i].matches = matches_arr
	}

	history.tournaments.array.forEach((tournament, i) => {
		tournament.id = String(i)
		tournament.proper_date = properDate(tournament.date)
	})
	return history.tournaments.array
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
