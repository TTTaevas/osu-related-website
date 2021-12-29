const request = require("./request.js")
require('dotenv').config()

async function getToken() {
	let response = await request(
		{"method": "post", "base_url_part": "oauth", "url": "token"},
		{},
		JSON.stringify({
			"grant_type": "client_credentials",
			"client_id": 11451,
			"client_secret": process.env.OSU_CLIENT_SECRET,
			"scope": "public"
		})
	)

	return response.access_token
}

async function getUser(token, user_id) {
	if (isNaN(user_id)) {return false}
	let response = await request(
		{"method": "get", "base_url_part": "api/v2/users", "url": user_id},
		{"Authorization": `Bearer ${token}`},
		{}
	)

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
	if (isNaN(match_id)) {return false}
	let response = await request(
		{"method": "get", "base_url_part": "api/v2/matches", "url": match_id},
		{"Authorization": `Bearer ${token}`},
		{}
	)

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
	getToken,
	getUser,
	getMatch
}
