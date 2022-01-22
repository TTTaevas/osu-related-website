require('dotenv').config()
const sanitize = require("./sanitizer.js")

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
			err.public = "osu!api seems to be down currently"
			err.main = main
			err.message = error.message
		} else {
			// Something happened in setting up the request that triggered an error
			err.type = "Setting up the request caused an (axios?) error"
			err.public = "Unknown error"
			err.main = main
			err.message = error.message
		}
		throw err
	})
	
	if (resp) {
		// let sanitized = sanitize(resp, "response") Seems useless to me :^) I wasn't even checking the pass smh
		//console.log(sanitized.obj.statusText, sanitized.obj.status, main)
		console.log(resp.statusText, resp.status, main)
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
				"client_secret": process.env.OSU_CLIENT_SECRET,
				"scope": "public"
			})
		)
	} catch {return false}

	if (!response) {return false}
	return response.access_token
}

async function getUser(token, user_id, mode) {
	let sanitized = sanitize(user_id, "id")
	if (sanitized.pass) {user_id = sanitized.obj} else {return false}

	if (!mode) {mode == "osu"}

	var response
	try {
		response = await request(
			{"method": "get", "base_url_part": "api/v2/users", "url": `${user_id}/${mode}`},
			{"Authorization": `Bearer ${token}`},
			{}
		)
	} catch {response = false}

	if (!response) {
		response = {
			country_code: "A",
			id: user_id,
			username: "RESTRICTED",
			statistics: {
				global_rank: Number.MAX_VALUE
			}
		}
	}

	return response
}

async function getBeatmap(token, diff_id) {
	let sanitized = sanitize(diff_id, "id")
	if (sanitized.pass) {diff_id = sanitized.obj} else {return false}

	var response
	try {
		response = await request(
			{"method": "get", "base_url_part": "api/v2/beatmaps", "url": `${diff_id}`},
			{"Authorization": `Bearer ${token}`},
			{}
		)
	} catch {response = false}

	return response
}

async function v1Beatmap(diff_id, mods) { // the need for this function to exist is extremely yikes
	const axios = require("axios")
	let sanitized = sanitize(diff_id, "id")
	if (sanitized.pass) {diff_id = sanitized.obj} else {return false}

	console.log(`Requesting v1 data for map ${diff_id} with mods ${mods}`)
	var response
	try {
		response = await axios({
			method: "get",
			baseURL: "https://osu.ppy.sh/api/",
			url: `/get_beatmaps?b=${diff_id}&mods=${mods}&k=${process.env.OSU_V1_KEY}`,
			headers: {
				"Content-Type": "application/json",
				"Accept": "application/json",
			}
		})
	} catch (e) {
		console.log(e)
		response = {data: false}
	}

	return response.data
}

async function getMatch(token, match_id, tournament) {
	let sanitized = sanitize(match_id, "id")
	if (sanitized.pass) {match_id = sanitized.obj} else {return false}

	var response
	try {
		response = await request(
			{"method": "get", "base_url_part": "api/v2/matches", "url": match_id},
			{"Authorization": `Bearer ${token}`},
			{}
		)
	} catch {return false}
	if (!response) {return false}

	var return_object
	let games = response.events.filter((event) => {if (event.game) {return event}})
	let players = []

	if (tournament) { // HISTORY
		let custom = {
			name: response.match.name,
			id: response.match.id,
			tournament: tournament,
			url: `https://osu.ppy.sh/community/matches/${response.match.id}`,
			date: new Date(response.match.start_time)
		}

		return_object = custom
	} else { // LAYER01
		let c_games = games.map((e) => {return e.game})
		let custom = {
			name: response.match.name,
			id: response.match.id,
			url: `https://osu.ppy.sh/community/matches/${response.match.id}`,
			games: c_games
		}
		return_object = custom
	}

	// The users object of the response include at least the referee, which we do not want
	for (let i = 0; i < games.length; i++) {
		let scores = games[i].game.scores
		for (let e = 0; e < scores.length; e++) {
			if (!players.find((player) => {return player.id == scores[e].user_id}) && scores[e].score > 0) {
				players.push(response.users.find((user) => {return user.id == scores[e].user_id}))
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
	v1Beatmap,
	getMatch
}
