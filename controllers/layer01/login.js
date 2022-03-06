const request = require("../../functions/osu-requests.js").request

exports.home = async (req, res) => {
	var response
	let status = {
		ok: true,
		user: undefined,
		reason: null,
		code: null
	}

	// if not logged in, if code in url
	if (req.query.code && !req.session.user) {
		response = await codeHandler(req)
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
		status.user = req.auth.user
	}
	
	status.ok ? res.status(200).redirect("/layer01") : res.status(201).render("layer01/login", {status: status})
}

async function codeHandler(req) {
	var token_object
	try {
		token_object = await request(
			{"method": "post", "base_url_part": "oauth", "url": "token"},
			{},
			JSON.stringify({
				"grant_type": "authorization_code",
				"client_id": 11451,
				"client_secret": process.env.OSU_CLIENT_SECRET,
				"redirect_uri": "https://taevas.xyz/layer01/login",
				"code": req.query.code
			})
		)
	} catch (e) {
		console.log(e)
		return e.public
	}

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

		// if user is not in db, put them in db
		let userCheck = req.auth.users.array.find((u) => {return u.id == user_object.id})
		if (!userCheck) {
			user = {
				id: user_object.id,
				username: user_object.username,
				avatar: user_object.avatar_url,
				country: user_object.country_code,
				rank: user_object.statistics.global_rank,
				discord: user_object.discord != null ? user_object.discord : "not specified",
				timezone: "not specified",
				user_object: user_object
			}
			let insertion = await req.auth.users.collection.insertOne(user)
			insertion.insertedId ? console.log(`New user: ${user_object.id} | ${user_object.username}`) : console.log(`Couldn't add new user: ${user_object.id} | ${user_object.username}`)

		// if user is in db, update their profile
		} else { 
			const filter = {_id: userCheck._id}
			const updated = {
				username: user_object.username,
				country: user_object.country_code,
				rank: user_object.statistics.global_rank,
				user_object: user_object
			}
			let update = await req.auth.users.collection.updateOne(filter, {$set: updated}) // Legit cannot bother to learn findOneAndUpdate()
			const findResultAgain = await req.auth.users.collection.findOne({id: user_object.id})
		}
	}

	req.session.user = user_object.id
	return user
}
