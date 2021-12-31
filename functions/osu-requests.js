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
		if (error.response) {
     		// Request made and server responded
     		console.log("\n/!\\", error.response.statusText, error.response.status, main)
    		throw new Error("\n/!\\", error.response.statusText, error.response.status, main)
    	} else if (error.request) {
    		// The request was made but no response was received
    		console.log("\n/!\\ No response received", error.message, main)
    		throw new Error("\n/!\\ No response received", error.message, main)
    	} else {
    		// Something happened in setting up the request that triggered an error
    		console.log("\n/!\\ Some axios error happened", error.message, main)
    		throw new Error("\n/!\\ Some axios error happened", error.message, main)
    	}
	})
	
	if (resp) {
		let sanitized = sanitize(resp, "response")
		console.log(sanitized.obj.statusText, sanitized.obj.status, main)
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

async function getUser(token, user_id) {
	let sanitized = sanitize(user_id, "id")
	if (sanitized.pass) {user_id = sanitized.obj} else {return false}

	var response
	try {
		response = await request(
			{"method": "get", "base_url_part": "api/v2/users", "url": user_id},
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
	let custom = {
		name: response.match.name,
		id: response.match.id,
		tournament: tournament,
		url: `https://osu.ppy.sh/community/matches/${response.match.id}`,
		date: new Date(response.match.start_time),
		players: []
	}
	

	let events = response.events.filter((event) => {if (event.game) {return event}})
	let users = []

	// The users object of the response include at least the referee, which we do not want
	for (let i = 0; i < events.length; i++) {
		let scores = events[i].game.scores
		for (let e = 0; e < scores.length; e++) {
			if (!users.find((user) => {return user.id == scores[e].user_id}) && scores[e].score > 0) {
				users.push(response.users.find((user) => {return user.id == scores[e].user_id}))
			}
		}
	}

	custom.players = users
	return custom
}

module.exports = {
	request,
	getToken,
	getUser,
	getMatch
}
