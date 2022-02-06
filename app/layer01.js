const express = require("express")
const router = express.Router()

const client = require("../database.js")
const userCheck = require("../functions/user-check.js")

const admin = require("../functions/admin.js")
const formHandler = require("../functions/form-handler.js")
const addStaff = require("../functions/add-staff.js")

var time_now

router.get("/", async (req, res) => {
	let check = await userCheck(client, req.session.user)
	res.status(200).render("layer01/home", {user: check.user})
})

router.get("/login", async (req, res) => {
	const sessionHandler = require("../functions/session-handler.js")
	let status = await sessionHandler(req, client)
	status.ok ? res.status(200).redirect("/layer01") : res.status(201).render("layer01/login", {status: status})
})

router.get("/rules", async (req, res) => {
	let check = await userCheck(client, req.session.user)
	res.status(200).render("layer01/rules", {user: check.user})
})


router.route("/playlists")
.get(async (req, res) => {
	let check = await userCheck(client, req.session.user)
	let playlists_col = check.db.collection("playlists")
	let pools = await playlists_col.find().toArray()
	res.status(200).render("layer01/playlists", {user: check.user, playlists: pools})
})
.post(async (req, res) => {
	let check = await userCheck(client, req.session.user, "admin")
	if (!check.authorized) {return res.status(403).render("layer01/error", {status: {code: 403, reason: "Unauthorized; you shouldn't be there :3c"}})}
	let form = await formHandler.playlist(check.db, req.body)
	res.redirect("/layer01/playlists")
})


router.route("/player-registration")
.get(async (req, res) => {
	let end_of_regs = new Date(Date.UTC(2022, 0, 31))
	time_now = new Date()
	if (time_now > end_of_regs) {return res.status(403).render("layer01/error", {status: {code: 403, reason: "We are no longer accepting player registrations! Sorry ><"}})}

	let check = await userCheck(client, req.session.user)
	let message = null
	if (check.user) {
		if (check.user.roles.pooler) {return res.status(403).render("layer01/error", {status: {code: 403, reason: "Poolers cannot play in the tournament"}})}
		if (check.user.roles.registered_player) {message = "You are already a player, but you can reregister if you want to change your discord/timezone :3c"}
		res.status(200).render("layer01/player-registration", {user: check.user, message: message})
	} else {
		res.redirect("/layer01")
	}
})
.post(async (req, res) => {
	let end_of_regs = new Date(Date.UTC(2022, 0, 31))
	time_now = new Date()
	if (time_now > end_of_regs) {return res.status(403).render("layer01/error", {status: {code: 403, reason: "We are no longer accepting player registrations! Sorry ><"}})}

	let check = await userCheck(client, req.session.user)
	if (!check.user) {return res.status(403).render("layer01/error", {status: {code: 403, reason: "Probably not logged in"}})}
	let form = await formHandler.player(check.user, check.collection, req.body)
	res.redirect("/layer01/players")
})


router.route("/players")
.get(async (req, res) => {
	let check = await userCheck(client, req.session.user)
	let players = check.users.filter((user) => {return user.roles.player})
	players = players.sort((a, b) => {return a.rank - b.rank}) // sort by rank
	res.status(200).render("layer01/players", {user: check.user, players: players})
})
.post(async (req, res) => {
	let check = await userCheck(client, req.session.user, "admin")
	if (!check.authorized) {return res.status(403).render("layer01/error", {status: {code: 403, reason: "Unauthorized; you shouldn't be there :3c"}})}
	admin.updatePlayers(check.users, check.collection)
	res.redirect("/layer01/players")
})


router.route("/staff-registration")
.get(async (req, res) => {
	let check = await userCheck(client, req.session.user)
	let message = null
	if (check.user) {
		if (check.user.roles.registered_staff) {message = "You have already registered as staff, but feel free to reregister if you need to change something :3"}
		if (check.user.roles.staff) {message = "You are already staff! You should ask Taevas if you want to change something :3c"}
		res.status(200).render("layer01/staff-registration", {user: check.user, message: message})
	} else {
		res.redirect("/layer01")
	}
})
.post(async (req, res) => {
	let check = await userCheck(client, req.session.user)
	if (!check.user) {return res.status(403).render("layer01/error", {status: {code: 403, reason: "Probably not logged in"}})}
	let form = await formHandler.staff(check.user, check.collection, check.db, req.body)
	res.status(200).render("layer01/staff-registration", {user: check.user, message: form.message})
})


router.route("/staff-regs")
.get(async (req, res) => {
	let check = await userCheck(client, req.session.user, "admin")
	if (!check.authorized) {return res.status(403).render("layer01/error", {status: {code: 403, reason: "Unauthorized; you shouldn't be there :3c"}})}

	let regs_col = check.db.collection("staff_regs")
	let regs = await regs_col.find().toArray()
	for (let i = 0; i < regs.length; i++) {regs[i].user = check.users.find((user) => user.id == regs[i].id)}
	res.status(200).render("layer01/staff-regs", {user: check.user, regs: regs})
})
.post(async (req, res) => {
	let check = await userCheck(client, req.session.user, "admin")
	if (!check.authorized) {return res.status(403).render("layer01/error", {status: {code: 403, reason: "Unauthorized; you shouldn't be there :3c"}})}
	await addStaff(check.db, check.collection, req.body)
	res.redirect("/layer01/staff-regs")
})


router.route("/referee")
.get(async (req, res) => {
	let check = await userCheck(client, req.session.user, "referee")
	if (!check.authorized) {return res.status(403).render("layer01/error", {status: {code: 403, reason: "Unauthorized; you shouldn't be there :3c"}})}

	let lobbies_col = check.db.collection("quals_lobbies")
	let lobbies = await lobbies_col.find().toArray()
	lobbies = lobbies.sort((a, b) => {return Number(a.schedule) - Number(b.schedule)})
	
	let lobby = false
	if (req.query.lobby) {lobby = lobbies.find((a) => {return a.id == req.query.lobby})}

	let playlist = false
	if (lobby) {
		let playlists_col = check.db.collection("playlists")
		let pools = await playlists_col.find().toArray()
		playlist = pools.find((p) => {return p.name.toLowerCase() == "qualifiers playlist"})
	}

	res.status(200).render("layer01/referee", {user: check.user, lobby: lobby, lobbies: lobbies, playlist: playlist})
})


router.route("/qualifiers")
.get(async (req, res) => {
	let check = await userCheck(client, req.session.user)
	let lobbies_col = check.db.collection("quals_lobbies")
	let lobbies = await lobbies_col.find().toArray()
	lobbies = lobbies.sort((a, b) => {return Number(a.schedule) - Number(b.schedule)})
	res.status(200).render("layer01/qualifiers", {user: check.user, lobbies: lobbies})
})
.post(async (req, res) => {
	if (!req.body) {return res.status(403).render("layer01/error", {status: {code: 403, reason: "Unauthorized; you shouldn't be there :3c"}})}
	var check
	var lobbies_col

	switch(req.body.act) {
		case "create":
			check = await userCheck(client, req.session.user, "admin")
			if (!check.authorized) {return res.status(403).render("layer01/error", {status: {code: 403, reason: "Unauthorized; you shouldn't be there :3c"}})}
			lobbies_col = check.db.collection("quals_lobbies")

			let new_lobbies = []
			for (let i = req.body.c_min; i <= req.body.c_max; i++) {
				let d = new Date(Date.UTC(2022, 1, 5, (i-1)*2))
				let lobby = {
					id: `${req.body.c_prefix}${i}`,
					schedule: d,
					referee: false,
					players: new Array(16).fill(false),
					mp_link: false
				}
				console.log(`Creating Qualifier Lobby ${req.body.c_prefix}${i}`)
				new_lobbies.push(lobby)
			}
			await lobbies_col.insertMany(new_lobbies)
			return res.redirect("/layer01/qualifiers")
			break
		case "ref_add":
			check = await userCheck(client, req.session.user, "referee")
			if (!check.authorized) {return res.status(403).render("layer01/error", {status: {code: 403, reason: "Unauthorized; you shouldn't be there :3c"}})}
			lobbies_col = check.db.collection("quals_lobbies")

			let reffed_lobbies = req.body.r_lobbies.toUpperCase().replace(/ /g, "").split(",")
			let referee = {referee: {id: check.user.id, name: check.user.username}}
			for (let i = 0; i < reffed_lobbies.length; i++) {
				let a = await lobbies_col.updateOne({id: reffed_lobbies[i]}, {$set: referee})
				if (a.modifiedCount) {console.log(`${reffed_lobbies[i]} is now being reffed by ${check.user.username}`)}
			}
			return res.redirect("/layer01/qualifiers")
			break
		case "ref_rem":
			check = await userCheck(client, req.session.user, "referee")
			if (!check.authorized) {return res.status(403).render("layer01/error", {status: {code: 403, reason: "Unauthorized; you shouldn't be there :3c"}})}
			lobbies_col = check.db.collection("quals_lobbies")

			let dropped_lobbies = req.body.r_lobbies.toUpperCase().replace(/ /g, "").split(",")
			for (let i = 0; i < dropped_lobbies.length; i++) {
				// Note that I could add to filter `referee: {id: check.user.id, name: check.user.username}`
				// But it's worth not adding it, mostly because some referees don't wanna bother go to sheet/website to drop
				let a = await lobbies_col.updateOne({id: dropped_lobbies[i]}, {$set: {referee: false}})
				if (a.modifiedCount) {console.log(`${dropped_lobbies[i]} has been dropped (referee) by ${check.user.username}`)}
			}
			return res.redirect("/layer01/qualifiers")
			break
		case "player_join":
			check = await userCheck(client, req.session.user, "player")
			if (!check.authorized) {return res.status(403).render("layer01/error", {status: {code: 403, reason: "Unauthorized; you shouldn't be there :3c"}})}
			lobbies_col = check.db.collection("quals_lobbies")
			let lobbies = await lobbies_col.find().toArray()

			let lobby_name = req.body.p_lobby.toUpperCase().replace(/ /g, "")
			let lobby = lobbies.find((e) => {return e.id == lobby_name})
			if (lobby) {
				time_now = new Date()
				if (time_now > lobby.schedule) {return res.status(403).render("layer01/error", {status: {code: 403, reason: "You're trying to join a lobby that has already happened!"}})}
				let free_spot = lobby.players.indexOf(false)
				if (free_spot != -1) {
					// Remove the player from all lobbies
					for (let i = 0; i < lobbies.length; i++) {
						for (let e = 0; e < lobbies[i].players.length; e++) {
							let player = lobbies[i].players[e]
							if (player && player.id == check.user.id) {
								if (time_now > lobbies[i].schedule) {return res.status(403).render("layer01/error", {status: {code: 403, reason: "You're trying to join a lobby despite being in a lobby that has already happened!"}})}
								let updated = lobbies[i].players
								updated[e] = false
								let remove = await lobbies_col.updateOne({id: lobbies[i].id}, {$set: {players: updated}})
								if (remove.modifiedCount) {console.log(`${check.user.username} has left lobby ${lobbies[i].id}`)}
							}
						}
					}

					// Add the player to the lobby
					// lobbies = await lobbies_col.find().toArray() // if needed to update? I don't think that's needed
					let players = lobby.players
					players[free_spot] = {id: check.user.id, name: check.user.username}
					let add = await lobbies_col.updateOne({id: lobby_name}, {$set: {players: players}})
					if (add.modifiedCount) {console.log(`${check.user.username} will be playing in lobby ${lobby_name}`)}
				}
			}

			return res.redirect("/layer01/qualifiers")
			break
		default:
			return res.status(403).render("layer01/error", {status: {code: 403, reason: "Unauthorized; you shouldn't be there :3c"}})
	}
})


router.route("/qualifiers-results")
.get(async (req, res) => {
	let check = await userCheck(client, req.session.user, "referee")
	if (!check.authorized) {return res.status(403).render("layer01/error", {status: {code: 403, reason: "Unauthorized; you shouldn't be there :3c"}})}
	
	let playlists_col = check.db.collection("playlists")
	let pools = await playlists_col.find().toArray()
	playlist = pools.find((p) => {return p.name.toLowerCase() == "qualifiers playlist"})

	let maps = playlist.maps.map((map) => {return {mod_id: map.mod_id, id: map.id, scores: []}})

	let quals_mps = check.db.collection("quals_mps")
	let matches = await quals_mps.find().toArray()
	for (let i = 0; i < matches.length; i++) {
		let players = matches[i].players
		for (let e = 0; e < matches[i].games.length; e++) {
			let game = matches[i].games[e]
			maps.forEach((map) => {
				if (map.id == game.beatmap.id) {
					for (let o = 0; o < game.scores.length; o++) {
						let already_has_score = map.scores.findIndex((score) => {return game.scores[o].user_id == score.user_id})
						if (already_has_score != -1) {map.scores.splice(already_has_score, 1)}

						let score = game.scores[o]
						let acc = score.accuracy.toPrecision(4).substring(2)
						acc = Number(`${acc.slice(0, 2)}.${acc.slice(2)}`)

						let player = players.find((player) => {return player.id == score.user_id})
						map.scores.push({user_id: score.user_id, username: player.username, score: score.score, acc: acc})
					}
				}
			})
		}
	}

	for (let i = 0; i < maps[0].scores.length; i++) { // Create a fake score of 0 for every map a player hasn't played
		for (let e = 0; e < maps.length; e++) { // Creating that is cool because it feels more transparent in the calculation process
			let has_score = maps[e].scores.findIndex((score) => {return maps[0].scores[i].user_id == score.user_id})
			if (has_score == -1) {
				maps[e].scores.push({user_id: maps[0].scores[i].user_id, username: maps[0].scores[i].username, score: 0, acc: 0})
			}
		}
	}
	
	maps.forEach((map) => { // so index is rank - 1
		map.scores.sort((a, b) => a.score - b.score).reverse() // is that optimal?
	})

	let seeds = []
	for (let i = 0; i < maps[0].scores.length; i++) {
		let user_id = maps[0].scores[i].user_id
		let seed = {user_id: user_id, username: maps[0].scores[i].username, avg_rank: 0}
		let rankings = []
		for (let e = 0; e < maps.length; e++) {
			let index = maps[e].scores.findIndex((score) => {return score.user_id == user_id})
			rankings.push(index == -1 ? maps[0].scores.length : index + 1) // index should not ever be -1 because we have created fake scores of 0 earlier
		}

		let total = 0
		rankings.forEach((r) => {total += r})
		seed.avg_rank = Number((total / rankings.length).toPrecision(3))
		seeds.push(seed)
	}
	seeds.sort((a, b) => {return a.avg_rank - b.avg_rank})

	res.status(200).render("layer01/qualifiers-results", {user: check.user, maps: maps, seeds: seeds})
})
.post(async (req, res) => {
	let check = await userCheck(client, req.session.user, "admin")
	if (!check.authorized) {return res.status(403).render("layer01/error", {status: {code: 403, reason: "Unauthorized; you shouldn't be there :3c"}})}

	let mp_id = Number(req.body.new_mplink.replace(/[^0-9]/g, ""))
	let quals_mps = check.db.collection("quals_mps")

	await admin.addMatch(mp_id, quals_mps)
	res.redirect("/layer01/qualifiers-results")
})


// 404
router.get("/*", (req, res) => {
	res.status(404).render("layer01/fourofour")
})

module.exports = router
