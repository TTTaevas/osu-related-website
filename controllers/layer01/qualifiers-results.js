const client = require("../../database.js")
const userCheck = require("../../functions/user-check.js")

const request = require("../../functions/osu-requests.js")

exports.home = async (req, res) => {
	let check = await userCheck(client, req.session.user)
	
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

	maps.forEach((map) => { // Calculate a map's average score
		let total = 0 // Do that before fake scores for more reliable data
		map.scores.forEach((s) => {total += s.score})
		map.avg_score = Math.round(total / map.scores.length)
	})

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
		let seed = {user_id: user_id, username: maps[0].scores[i].username, avg_score: 0, avg_rank: 0}

		let rankings = []
		let scores = []
		for (let e = 0; e < maps.length; e++) {
			let index = maps[e].scores.findIndex((score) => {return score.user_id == user_id})
			rankings.push(index == -1 ? maps[0].scores.length : index + 1) // index should not ever be -1 because we have created fake scores of 0 earlier
			scores.push(index == -1 ? 0 : maps[e].scores[index].score) // index should not ever be -1 because we have created fake scores of 0 earlier
		}

		let s_total = 0
		scores = scores.filter((s) => {return s > 0})
		scores.forEach((s) => {s_total += s})
		seed.avg_score = Math.round(s_total / scores.length)

		let r_total = 0
		rankings.forEach((r) => {r_total += r})
		seed.avg_rank = Number((r_total / rankings.length).toPrecision(3))
		seeds.push(seed)
	}
	seeds.sort((a, b) => {return a.avg_rank - b.avg_rank})

	res.status(200).render("layer01/qualifiers-results", {user: check.user, maps: maps, seeds: seeds})
}

exports.create = async (req, res) => {
	let check = await userCheck(client, req.session.user, "admin")
	if (!check.authorized) {return res.status(403).render("layer01/error", {status: {code: 403, reason: "Unauthorized; you shouldn't be there :3c"}})}

	let mp_id = Number(req.body.new_mplink.replace(/[^0-9]/g, ""))
	let quals_mps = check.db.collection("quals_mps")

	let creation = await createMatch(mp_id, quals_mps)
	console.log(`Adding match to qualifiers results: ${creation.message}`)
	res.redirect("/layer01/qualifiers-results")
}

async function createMatch(id, match_col) {
	let token = await request.getToken()
	let match = await request.getMatch(token, id)

	if (match && match.games) {
		for (let i = 0; i < match.games.length; i++) {
			for (let e = 0; e < match.games[i].scores.length; e++) {
				let mods = match.games[i].scores[e].mods
				if (mods.includes("HD") && (mods.includes("HR") || mods.includes("DT"))) {
					match.games[i].scores[e].score = Math.round(match.games[i].scores[e].score / 1.06)
				}
			}
		}
		let insertion = await match_col.insertOne(match)
		return insertion.insertedId ? {ok: true, message: `${match.name} now in the collection!`} : {ok: false, message: `Could not add ${match.name}...`}
	} else {return {ok: false, message: `${id} doesn't seem valid...`}}
}
