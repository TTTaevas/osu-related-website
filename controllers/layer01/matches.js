const client = require("../../database.js")
const userCheck = require("../../functions/user-check.js")

exports.home = async (req, res) => {
	let check = await userCheck(client, req.session.user)
	let brackets_col = check.db.collection("brackets")
	let brackets = await brackets_col.find().toArray()

	res.status(200).render("layer01/matches", {user: check.user, brackets: brackets})
}

exports.update = async (req, res) => { // Need to rework that ugly shit, like, for real
	if (!req.body) {return res.status(403).render("layer01/error", {status: {code: 403, reason: "Unauthorized; you shouldn't be there :3c"}})}
	var check
	var brackets_col
	var brackets
	var mode

	switch(req.body.act) {
		case "create":
			check = await userCheck(client, req.session.user, "admin")
			if (!check.authorized) {return res.status(403).render("layer01/error", {status: {code: 403, reason: "Unauthorized; you shouldn't be there :3c"}})}
			brackets_col = check.db.collection("brackets")

			let bracket = {
				name: req.body.c_bracket_name,
				matches: []
			}

			// There should be no case in which I'd make a bracket with only 1 match but just in case
			if (!Array.isArray(req.body.c_id)) {return res.status(403).render("layer01/error", {status: {code: 403, reason: "Only 1 match?"}})}
			for (let i = 0; i < req.body.c_id.length; i++) {
				// date format in input should be mm-dd hh:mm
				let month = Number(req.body.c_time[i].substring(0, 2)) - 1
				let day = req.body.c_time[i].substring(3, 5)
				let hour = req.body.c_time[i].substring(6, 8)
				let minutes = req.body.c_time[i].substring(9, 11)
				let date = new Date(Date.UTC(2022, month, day, hour, minutes)) // yes it uses both integers and strings

				// worse code
				let player1 = check.users.find((user) => {return user.username.toLowerCase() == req.body.c_player_1[i].toLowerCase()})
				player1 = player1 ? {id: player1.id, username: player1.username} : {id: 0, username: "undetermined"}
				let player2 = check.users.find((user) => {return user.username.toLowerCase() == req.body.c_player_2[i].toLowerCase()})
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
			
			await brackets_col.insertOne(bracket)
			console.log(`Created ${req.body.c_bracket_name}!`)
			return res.redirect("/layer01/matches")
			break
		case "ref_add":
		case "str_add":
		case "com_add":
			mode = req.body.act == "ref_add" ? "ref" : req.body.act == "str_add" ? "str" : "com"
			if (mode == "ref") {
				check = await userCheck(client, req.session.user, "referee")
			} else if (mode == "str") {
				check = await userCheck(client, req.session.user, "streamer")
			} else {
				check = await userCheck(client, req.session.user, "commentator")
			}
			if (!check.authorized) {return res.status(403).render("layer01/error", {status: {code: 403, reason: "Unauthorized; you shouldn't be there :3c"}})}
			brackets_col = check.db.collection("brackets")
			brackets = await brackets_col.find().toArray()

			let taken_matches = req.body.matches.replace(/ /g, "").split(",")
			for (let i = 0; i < taken_matches.length; i++) {
				let bracket_to_add_to = brackets.find((b) => {return b.matches.findIndex((m) => {return m.id == taken_matches[i]}) != -1})
				if (!bracket_to_add_to) {console.log(`Couldn't add ${check.user.username} as ${mode}, didn't find ${taken_matches[i]}`); continue}
				let matches_arr = bracket_to_add_to.matches
				let index = matches_arr.findIndex((m) => {return m.id == taken_matches[i]})

				if (index != -1) {
					if (mode == "ref") {
						matches_arr[index].referee = {id: check.user.id, name: check.user.username}
					} else if (mode == "str") {
						matches_arr[index].streamer = {id: check.user.id, name: check.user.username}
					} else {
						let free_spot = matches_arr[index].commentators.indexOf(false)
						if (free_spot != -1) {matches_arr[index].commentators[free_spot] = {id: check.user.id, name: check.user.username}}
					}
				}
				
				let a = await brackets_col.updateOne({name: bracket_to_add_to.name}, {$set: {matches: matches_arr}})
				if (a.modifiedCount) {console.log(`${check.user.username} is now ${mode} of ${taken_matches[i]}`)}
			}
			return res.redirect("/layer01/matches")
			break
		case "ref_rem":
		case "str_rem":
		case "com_rem":
			mode = req.body.act == "ref_rem" ? "ref" : req.body.act == "str_rem" ? "str" : "com"
			if (mode == "ref") {
				check = await userCheck(client, req.session.user, "referee")
			} else if (mode == "str") {
				check = await userCheck(client, req.session.user, "streamer")
			} else {
				check = await userCheck(client, req.session.user, "commentator")
			}
			if (!check.authorized) {return res.status(403).render("layer01/error", {status: {code: 403, reason: "Unauthorized; you shouldn't be there :3c"}})}
			brackets_col = check.db.collection("brackets")
			brackets = await brackets_col.find().toArray()

			let dropped_matches = req.body.matches.replace(/ /g, "").split(",")
			for (let i = 0; i < dropped_matches.length; i++) {
				let bracket_to_remove_from = brackets.find((b) => {return b.matches.findIndex((m) => {return m.id == dropped_matches[i]}) != -1})
				if (!bracket_to_remove_from) {console.log(`Couldn't remove ${check.user.username} as ${mode}, didn't find ${dropped_matches[i]}`); continue}
				let matches_arr = bracket_to_remove_from.matches
				let index = matches_arr.findIndex((m) => {return m.id == dropped_matches[i]})

				if (index != -1) {
					if (mode == "ref") {
						matches_arr[index].referee = false
					} else if (mode == "str") {
						matches_arr[index].streamer = false
					} else {
						let freeing_spot = matches_arr[index].commentators.findIndex((c) => {return c.id == check.user.id})
						if (freeing_spot != -1) {matches_arr[index].commentators[freeing_spot] = false}
					}
				}
				
				let a = await brackets_col.updateOne({name: bracket_to_remove_from.name}, {$set: {matches: matches_arr}})
				if (a.modifiedCount) {console.log(`${check.user.username} is no longer ${mode} of ${dropped_matches[i]}`)}
			}
			return res.redirect("/layer01/matches")
			break
	}
	res.redirect("/layer01/matches")
}
