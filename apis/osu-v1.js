require('dotenv').config()

async function request(type, params) {
	const axios = require("axios")

	const resp = await axios({
		method: "get",
		baseURL: "https://osu.ppy.sh/api/",
		url: `/${type}?k=${process.env.API_OSU_V1}&${params}`,
		headers: { // In theory not needed, still cool to have though imo
			"Accept": "application/json",
			"Content-Type": "application/json"
		}
	})
	.catch((error) => {
		let err = new Error("\n/!\\ An error happened while doing a request to osu!api v1")
		if (error.response) {
			err.type = "Request made and server responded"
			err.public = "Invalid code!"
			err.status = error.response.status
			err.statusText = error.response.statusText
			err.response = error.response.data
			if (error.response.config) {err.config = error.response.config.data}
		} else if (error.request) {
			err.type = "Request made but server did not respond"
			err.public = "osu!api v1 seems to be down currently"
			err.message = error.message
		} else {
			// Something happened in setting up the request that triggered an error
			err.type = "Setting up the request caused an (axios?) error"
			err.public = "Unknown error"
			err.message = error.message
		}
		throw err
	})
	
	if (resp) {
		console.log("osu!api v1 ->", resp.statusText, resp.status, {type, params})
		return resp.data
	} else {
		return false
	}
	
}

// Since this function is unused, I won't bother thinking about it not having user_best & user_recent
async function getUser(id, mode) { // We don't need events, right?
	if (!mode) {mode = "0"} // 0 (osu) is already default in api v1, but better to specify here anyway
	var response
	try {response = await request("get_user", `type=id&u=${id}&mode=${mode}`)}
	catch (e) {
		console.log(e)
		response = false
	}

	return response
}

async function getBeatmap(diff_id, mods) {
	if (!mods) {mods = "0"}
	var response
	try {response = await request("get_beatmaps", `b=${diff_id}&mods=${mods}`)}
	catch (e) {
		console.log(e)
		response = false
	}

	return response
}

async function getMatch(id) {
	var response
	try {response = await request("get_match", `m=${id}`)}
	catch (e) {
		console.log(e)
		response = false
	}

	return response
}

module.exports = {
	request,
	getUser,
	getBeatmap,
	getMatch
}
