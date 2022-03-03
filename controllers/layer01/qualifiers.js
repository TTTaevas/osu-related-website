const existenceCheck = require("../../functions/existence-check.js")

exports.home = async (req, res) => {
	let lobbies_col = req.layer01.db.collection("quals_lobbies")
	let lobbies = await lobbies_col.find().toArray()
	lobbies = lobbies.sort((a, b) => {return Number(a.schedule) - Number(b.schedule)})
	res.status(200).render("layer01/qualifiers", {user: req.auth.user, lobbies: lobbies})
}

exports.create = async (req, res) => {
	if (!existenceCheck(req.body, ["c_min", "c_max", "c_prefix"])) {return res.status(400).render("layer01/error", {status: {code: 400, reason: "Bad request"}})}

	let lobbies_col = req.layer01.db.collection("quals_lobbies")
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
		new_lobbies.push(lobby)
	}

	let insertion = await lobbies_col.insertMany(new_lobbies)
	console.log(`${insertion.insertedCount}/${new_lobbies.length} qualifiers lobbies created!`)
	res.redirect("/layer01/qualifiers")
}

exports.join = async (req, res) => {
	if (!existenceCheck(req.body, ["p_lobby"])) {return res.status(400).render("layer01/error", {status: {code: 400, reason: "Bad request"}})}
	
	let lobbies_col = req.layer01.db.collection("quals_lobbies")
	let lobbies = await lobbies_col.find().toArray()
	let lobby_name = req.body.p_lobby.toUpperCase().replace(/ /g, "")
	let lobby = lobbies.find((e) => {return e.id == lobby_name})

	if (lobby) {
		let time_now = new Date()
		if (time_now > lobby.schedule) {return res.status(403).render("layer01/error", {status: {code: 403, reason: "You're trying to join a lobby that has already happened!"}})}
		let free_spot = lobby.players.indexOf(false)
		if (free_spot != -1) {
			// Remove the player from all lobbies
			for (let i = 0; i < lobbies.length; i++) {
				for (let e = 0; e < lobbies[i].players.length; e++) {
					let player = lobbies[i].players[e]
					if (player && player.id == req.auth.user.id) {
						if (time_now > lobbies[i].schedule) {return res.status(403).render("layer01/error", {status: {code: 403, reason: "You're trying to join a lobby despite being in a lobby that has already happened!"}})}
						let updated = lobbies[i].players
						updated[e] = false
						let remove = await lobbies_col.updateOne({id: lobbies[i].id}, {$set: {players: updated}})
						if (remove.modifiedCount) {console.log(`${req.auth.user.username} has left lobby ${lobbies[i].id}`)}
					}
				}
			}

			// Add the player to the lobby
			// lobbies = await lobbies_col.find().toArray() // if needed to update? I don't think that's needed
			let players = lobby.players
			players[free_spot] = {id: req.auth.user.id, name: req.auth.user.username}
			let add = await lobbies_col.updateOne({id: lobby_name}, {$set: {players: players}})
			if (add.modifiedCount) {console.log(`${req.auth.user.username} will be playing in lobby ${lobby_name}`)}
		}
	}

	return res.redirect("/layer01/qualifiers")
}

exports.referee_add = async (req, res) => {
	if (!existenceCheck(req.body, ["r_lobbies"])) {return res.status(400).render("layer01/error", {status: {code: 400, reason: "Bad request"}})}
	let lobbies_col = req.layer01.db.collection("quals_lobbies")

	let reffed_lobbies = req.body.r_lobbies.toUpperCase().replace(/ /g, "").split(",")
	let referee = {referee: {id: req.auth.user.id, name: req.auth.user.username}}
	for (let i = 0; i < reffed_lobbies.length; i++) {
		let update = await lobbies_col.updateOne({id: reffed_lobbies[i]}, {$set: referee})
		if (update.modifiedCount) {console.log(`${reffed_lobbies[i]} is now being reffed by ${req.auth.user.username}`)}
	}
	return res.redirect("/layer01/qualifiers")
}

exports.referee_remove = async (req, res) => {
	if (!existenceCheck(req.body, ["r_lobbies"])) {return res.status(400).render("layer01/error", {status: {code: 400, reason: "Bad request"}})}
	let lobbies_col = req.layer01.db.collection("quals_lobbies")

	let dropped_lobbies = req.body.r_lobbies.toUpperCase().replace(/ /g, "").split(",")
	for (let i = 0; i < dropped_lobbies.length; i++) {
		// Note that I could add to filter `referee: {id: req.auth.user.id, name: req.auth.user.username}`
		// But it's worth not adding it, mostly because some referees don't wanna bother go to sheet/website to drop
		let update = await lobbies_col.updateOne({id: dropped_lobbies[i]}, {$set: {referee: false}})
		if (update.modifiedCount) {console.log(`${dropped_lobbies[i]} has been dropped (referee) by ${req.auth.user.username}`)}
	}
	return res.redirect("/layer01/qualifiers")
}

