const existenceCheck = require("../../functions/existence-check.js")

exports.home = async (req, res) => {
	let brackets_col = req.layer01.db.collection("brackets")
	let brackets = await brackets_col.find().toArray()
	res.status(200).render("layer01/matches", {user: req.auth.user, brackets: brackets})
}

exports.create = async (req, res) => {
	if (!existenceCheck(req.body, ["c_bracket_name", "c_id", "c_time", "c_type"])) {return res.status(400).render("layer01/error", {status: {code: 400, reason: "Bad request"}})}
	let brackets_col = req.layer01.db.collection("brackets")

	let bracket = {
		name: req.body.c_bracket_name,
		matches: []
	}
	
	for (let i = 0; i < req.body.c_id.length; i++) {
		// date format in input should be mm-dd hh:mm
		let month = Number(req.body.c_time[i].substring(0, 2)) - 1
		let day = req.body.c_time[i].substring(3, 5)
		let hour = req.body.c_time[i].substring(6, 8)
		let minutes = req.body.c_time[i].substring(9, 11)
		let date = new Date(Date.UTC(2022, month, day, hour, minutes)) // yes it uses both integers and strings

		// worse code
		let player1 = req.auth.users.array.find((user) => {return user.username.toLowerCase() == req.body.c_player_1[i].toLowerCase()})
		player1 = player1 ? {id: player1.id, username: player1.username} : {id: 0, username: "undetermined"}
		let player2 = req.auth.users.array.find((user) => {return user.username.toLowerCase() == req.body.c_player_2[i].toLowerCase()})
		player2 = player2 ? {id: player2.id, username: player2.username} : {id: 0, username: "undetermined"}

		let match = {
			id: req.body.c_id[i],
			players: [player1, player2],
			scores: [0, 0],
			schedule: date,
			type: req.body.c_type[i].toLowerCase(),
			referee: false,
			streamer: false,
			commentators: new Array(4).fill(false),
			mp_link: false
		}
		bracket.matches.push(match)
	}
	if (!bracket.matches.length) {return res.status(400).render("layer01/error", {status: {code: 400, reason: "No match"}})}

	let insertion = await brackets_col.insertOne(bracket)
	insertion.insertedId ? console.log(`Created ${req.body.c_bracket_name}!`) : console.log(`Failed to create ${req.body.c_bracket_name}`)
	return res.redirect("/layer01/matches")
}

exports.staff_add = async (req, res) => {
	if (!existenceCheck(req.body, ["act", "matches"])) {return res.status(400).render("layer01/error", {status: {code: 400, reason: "Bad request"}})}

	let mode = req.body.act
	if (mode == "ref") {
		if (!req.auth.user.roles.referee) {return res.status(403).render("layer01/error", {status: {code: 403, reason: "Unauthorized; you're not authorized to do this :3c"}})}
	} else if (mode == "str") {
		if (!req.auth.user.roles.streamer) {return res.status(403).render("layer01/error", {status: {code: 403, reason: "Unauthorized; you're not authorized to do this :3c"}})}
	} else if (mode == "com") {
		if (!req.auth.user.roles.commentator) {return res.status(403).render("layer01/error", {status: {code: 403, reason: "Unauthorized; you're not authorized to do this :3c"}})}
	} else {
		return res.status(400).render("layer01/error", {status: {code: 400, reason: "Bad request"}})
	}

	let brackets_col = req.layer01.db.collection("brackets")
	let brackets = await brackets_col.find().toArray()
	let taken_matches = req.body.matches.replace(/ /g, "").split(",")
	
	for (let i = 0; i < taken_matches.length; i++) {
		let bracket_to_add_to = brackets.find((b) => {return b.matches.findIndex((m) => {return m.id == taken_matches[i]}) != -1})
		if (!bracket_to_add_to) {console.log(`Couldn't add ${req.auth.user.username} as ${mode}, didn't find match ${taken_matches[i]}`); continue}
		let matches_arr = bracket_to_add_to.matches
		let index = matches_arr.findIndex((m) => {return m.id == taken_matches[i]})

		if (index != -1) {
			if (mode == "ref") {
				matches_arr[index].referee = {id: req.auth.user.id, name: req.auth.user.username}
			} else if (mode == "str") {
				matches_arr[index].streamer = {id: req.auth.user.id, name: req.auth.user.username}
			} else {
				let free_spot = matches_arr[index].commentators.indexOf(false)
				if (free_spot != -1) {matches_arr[index].commentators[free_spot] = {id: req.auth.user.id, name: req.auth.user.username}}
			}
		}
				
		let update = await brackets_col.updateOne({name: bracket_to_add_to.name}, {$set: {matches: matches_arr}})
		if (update.modifiedCount) {console.log(`${req.auth.user.username} is now ${mode} of ${taken_matches[i]}`)}
	}

	return res.redirect("/layer01/matches")
}

exports.staff_remove = async (req, res) => {
	if (!existenceCheck(req.body, ["act", "matches"])) {return res.status(400).render("layer01/error", {status: {code: 400, reason: "Bad request"}})}

	let mode = req.body.act
	if (mode == "ref") {
		if (!req.auth.user.roles.referee) {return res.status(403).render("layer01/error", {status: {code: 403, reason: "Unauthorized; you're not authorized to do this :3c"}})}
	} else if (mode == "str") {
		if (!req.auth.user.roles.streamer) {return res.status(403).render("layer01/error", {status: {code: 403, reason: "Unauthorized; you're not authorized to do this :3c"}})}
	} else if (mode == "com") {
		if (!req.auth.user.roles.commentator) {return res.status(403).render("layer01/error", {status: {code: 403, reason: "Unauthorized; you're not authorized to do this :3c"}})}
	} else {
		return res.status(400).render("layer01/error", {status: {code: 400, reason: "Bad request"}})
	}
	
	let brackets_col = req.layer01.db.collection("brackets")
	let brackets = await brackets_col.find().toArray()
	let dropped_matches = req.body.matches.replace(/ /g, "").split(",")

	for (let i = 0; i < dropped_matches.length; i++) {
		let bracket_to_remove_from = brackets.find((b) => {return b.matches.findIndex((m) => {return m.id == dropped_matches[i]}) != -1})
		if (!bracket_to_remove_from) {console.log(`Couldn't remove ${req.auth.user.username} as ${mode}, didn't find match ${dropped_matches[i]}`); continue}
		let matches_arr = bracket_to_remove_from.matches
		let index = matches_arr.findIndex((m) => {return m.id == dropped_matches[i]})

		if (index != -1) {
			if (mode == "ref") {
				matches_arr[index].referee = false
			} else if (mode == "str") {
				matches_arr[index].streamer = false
			} else {
				let freeing_spot = matches_arr[index].commentators.findIndex((c) => {return c.id == req.auth.user.id})
				if (freeing_spot != -1) {matches_arr[index].commentators[freeing_spot] = false}
			}
		}

		let update = await brackets_col.updateOne({name: bracket_to_remove_from.name}, {$set: {matches: matches_arr}})
		if (update.modifiedCount) {console.log(`${req.auth.user.username} is no longer ${mode} of ${dropped_matches[i]}`)}
	}

	return res.redirect("/layer01/matches")
}
