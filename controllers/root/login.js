const { request } = require("../../apis/osu-v2.js")

exports.home = async (req, res) => {
	let status = {
		ok: true,
		reason: null
	}

	// if not logged in, if code in url
	if (req.query.code && !req.session.user) {
		let response = await codeHandler(req)
		if (response != "ok") {
			status.ok = false
			status.reason = `${response}, could not login`
		}

	// if not logged in, if no code in url
	} else if (!req.query.code && !req.session.user) {
		status.ok = false
		status.reason = "not logged in"
	}
	
	status.ok ? res.status(200).redirect("/") : res.status(201).render("root/login", {status: status})
}

async function codeHandler(req) {
	// create user_object through requesting "token" and "me(/osu)"
	var token_object
	try {
		token_object = await request(
			{"method": "post", "base_url_part": "oauth", "url": "token"},
			{},
			JSON.stringify({
				"grant_type": "authorization_code",
				"client_id": 11451,
				"client_secret": process.env.API_OSU_V2,
				"redirect_uri": "https://taevas.xyz/login",
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
	} catch (e) {
		console.log(e)
		return "could not fetch user data"
	}

	// deal with users db stuff
	if (user_object && user_object.id) {

		// if user is not in db, put them in db
		let userCheck = await req.auth.users.collection.findOne({id: user_object.id})
		if (!userCheck) {
			const user = {
				id: user_object.id,
				username: user_object.username,
				avatar: user_object.avatar_url,
				country: user_object.country_code,
				rank: user_object.statistics.global_rank,
				discord: user_object.discord,
				timezone: null,
				login_count: 1
			}
			let insertion = await req.auth.users.collection.insertOne(user)
			if (!insertion.insertedId) {
				console.warn(`/!\\ Couldn't add new user: ${user_object.id} | ${user_object.username}`)
				return "issue with database"
			}
			console.log(`New user: ${user_object.id} | ${user_object.username}`)

		// if user is in db, update their profile
		} else { 
			const filter = {_id: userCheck._id}
			const updated = {
				username: user_object.username,
				country: user_object.country_code,
				rank: user_object.statistics.global_rank,
				discord: user_object.discord ? user_object.discord : userCheck.discord,
				login_count: userCheck.login_count + 1 || 1
			}
			let update = await req.auth.users.collection.updateOne(filter, {$set: updated}) // Legit cannot bother to learn findOneAndUpdate()
			update.modifiedCount ? console.log(`User logged in: ${user_object.id} | ${user_object.username}`) : console.warn(`/!\\ Couldn't update user: ${user_object.id} | ${user_object.username}`)
		}
	}

	// set a cookie and associate it to the user; create a session
	req.session.user = user_object.id
	return "ok"
}
