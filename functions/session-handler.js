const request = require("./osu-requests.js").request
const userCheck = require("./user-check.js")

module.exports = async function sessionHandler(req, client) {
	var response
	let status = {
		ok: true,
		user: undefined,
		reason: null,
		code: null
	}

	// if not logged in, if code in url
	if (req.query.code && !req.session.user) {
		response = await codeHandler(req, client)
		if (typeof response == "string") {
			status.ok = false
			status.reason = response
		} else {
			status.user = response
		}

		// if not logged in, if no code in url
	} else if (!req.query.code && !req.session.user) {
		status.ok = false
		status.reason = "not logged in"

		// if logged in, no matter if code 
	} else if (req.session.user) {
		let data = await userCheck(client, req.session.user)
		status.user = data.user
	}
	
	return status
}

async function codeHandler(req, client) {
	var token_object
	try {
		token_object = await request(
			{"method": "post", "base_url_part": "oauth", "url": "token"},
			{},
			JSON.stringify({
				"grant_type": "authorization_code",
				"client_id": 11451,
				"client_secret": process.env.OSU_CLIENT_SECRET,
				"redirect_uri": "https://taevas.xyz/",
				"code": req.query.code
			})
		)
	} catch {return "Invalid code!"}

	var user_object
	try {
		user_object = await request(
			{"method": "get", "base_url_part": "api/v2", "url": "me/osu"},
			{"Authorization": `Bearer ${token_object.access_token}`},
			{}
		)
	} catch {return "You don't seem to exist... wait what, contact Taevas immediately"}

	var user
	
	// deal with users db stuff
	if (user_object && user_object.id) {
		let data = await userCheck(client, user_object.id)
		// if user is not in db, put them in db
		if (!data.user) {
			user = {
				id: user_object.id,
				username: user_object.username,
				avatar: user_object.avatar_url,
				country: user_object.country_code,
				rank: user_object.statistics.global_rank,
				discord: user_object.discord != null ? user_object.discord : "not specified",
				roles: {
					admin: false,
					referee: false,
					pooler: false,
					streamer: false,
					commentator: false,
					staff: false,
					registered_staff: false,
					player: false,
					registered_player: false
				},
				user_object: user_object
			}
			await data.collection.insertOne(user)
		} else { // if user is in db, update their profile
			const filter = {_id: data.user._id}
			const updated = {
				username: user_object.username,
				country: user_object.country_code,
				rank: user_object.statistics.global_rank,
				user_object: user_object
			}
			await data.collection.updateOne(filter, {$set: updated})
			const findResultAgain = await data.collection.find({id: user_object.id}).toArray()
			user = findResultAgain[0] // if only updateOne could return full updated doc
		}
	}

	req.session.user = user_object.id
	return user
}
