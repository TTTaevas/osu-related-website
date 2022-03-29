require('dotenv').config()

async function request(main, header_part, data) {
	const axios = require("axios")

	// FOR SOME REASON, WHERE DOCUMENTATION INDICATES `body`, WE NEED TO REPLACE WITH `data`
	const resp = await axios({
		method: main.method,
		baseURL: `https://osu.ppy.sh/${main.base_url_part}/`,
		url: `/${main.url}`,
		headers: {
			"Accept": "application/json",
			"Content-Type": "application/json",
			...header_part
		},
		data: data
	})
	.catch((error) => {
		let err = new Error("\n/!\\ An error happened while doing a request to osu!api v2")
		if (error.response) {
			err.type = "Request made and server responded"
			err.public = "Invalid code!"
			err.main = main
			err.status = error.response.status
			err.statusText = error.response.statusText
			err.response = error.response.data
			if (error.response.config) {err.config = error.response.config.data}
		} else if (error.request) {
			err.type = "Request made but server did not respond"
			err.public = "osu!api v2 seems to be down currently"
			err.main = main
			err.message = error.message
		} else { // Something happened in setting up the request that triggered an error
			err.type = "Setting up the request caused an (axios?) error"
			err.public = "Unknown error"
			err.main = main
			err.message = error.message
		}
		throw err
	})
	
	if (resp) {
		console.log("osu!api v2 ->", resp.statusText, resp.status, main)
		return resp.data
	} else {
		return false
	}
	
}

async function getToken() {
	var response
	try {
		response = await request(
			{"method": "post", "base_url_part": "oauth", "url": "token"},
			{},
			JSON.stringify({
				"grant_type": "client_credentials",
				"client_id": 11451,
				"client_secret": process.env.API_OSU_V2,
				"scope": "public"
			})
		)
	} catch(e) {console.log(e)}

	if (!response) {return false}
	return response.access_token
}

async function getUser(token, user_id, mode) {
	if (!mode) {mode == "osu"} // We always want osu mode over a user's "favourite" mode

	var response
	try {
		response = await request(
			{"method": "get", "base_url_part": "api/v2/users", "url": `${user_id}/${mode}`},
			{"Authorization": `Bearer ${token}`},
			{}
		)
	} catch(e) {if (e.status != 404) {console.log(e)}}

	if (!response) {return false}
	return response
}

async function getBeatmap(token, diff_id) {
	var response
	try {
		response = await request(
			{"method": "get", "base_url_part": "api/v2/beatmaps", "url": `${diff_id}`},
			{"Authorization": `Bearer ${token}`},
			{}
		)
	} catch(e) {if (e.status != 404) {console.log(e)}}
	
	if (!response) {return false}
	return response
}

async function getMatch(token, match_id) {
	var response
	try {
		response = await request(
			{"method": "get", "base_url_part": "api/v2/matches", "url": match_id},
			{"Authorization": `Bearer ${token}`},
			{}
		)
	} catch(e) {if (e.status != 404) {console.log(e)}}
	if (!response || !response.events) {return false}

	let games = response.events.filter((event) => {if (event.game) {return event}})
	let players = []

	let return_object = {
		id: response.match.id,
		name: response.match.name,
		date: new Date(response.match.start_time),
		games: games.map((e) => {return e.game})
	}

	// Vanilla events are such trash objects, holy shit
	for (let i = 0; i < games.length; i++) {
		delete games[i].detail
		delete games[i].timestamp
		delete games[i].user_id // the fuck is that

		games[i].game.beatmap = games[i].game.beatmap ? {
			id: games[i].game.beatmap.id,
			set_id: games[i].game.beatmap.beatmapset_id
		} : {id: 0, set_id: 0} // map is not in object if deleted
		
		let scores = games[i].game.scores
		for (let e = 0; e < scores.length; e++) {
			let acc_alt = games[i].game.scores[e].accuracy.toPrecision(4).substring(2)
			games[i].game.scores[e] = {
				id: games[i].game.scores[e].id, // null until ppy says otherwise
				player_id: games[i].game.scores[e].user_id,
				score: games[i].game.scores[e].score,
				mods: games[i].game.scores[e].mods,
				combo: games[i].game.scores[e].max_combo,
				accuracy: games[i].game.scores[e].accuracy,
				accuracy_alt: Number(`${acc_alt.slice(0, 2)}.${acc_alt.slice(2)}`), // acc but usable
				statistics: games[i].game.scores[e].statistics,
				match: games[i].game.scores[e].match,
			}

			// The users object of the response include at least the referee, which we do not want
			if (!players.find((player) => {return player.id == scores[e].player_id}) && scores[e].score > 0) {
				let player = response.users.find((user) => {return user.id == scores[e].player_id})
				players.push({ 
					id: player.id,
					username: player.username
				})
			}
		}
	}
	return_object.players = players

	return return_object
}

module.exports = {
	request,
	getToken,
	getUser,
	getBeatmap,
	getMatch
}
