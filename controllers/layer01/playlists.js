const client = require("../../database.js")
const userCheck = require("../../functions/user-check.js")

const request = require("../../functions/osu-requests.js")
const sanitize = require("../../functions/sanitizer.js")

exports.home = async (req, res) => {
	let check = await userCheck(client, req.session.user)
	let playlists_col = check.db.collection("playlists")
	let pools = await playlists_col.find().toArray()
	res.status(200).render("layer01/playlists", {user: check.user, playlists: pools})
}

exports.create = async (req, res) => {
	let check = await userCheck(client, req.session.user, "admin")
	if (!check.authorized) {return res.status(403).render("layer01/error", {status: {code: 403, reason: "Unauthorized; you shouldn't be there :3c"}})}

	let creation = await createPlaylist(check.db, req.body)
	console.log(`Playlist creation: ${creation.message}`)
	res.redirect("/layer01/playlists")
}

async function createPlaylist(db, form) {
	if (!form) {return {ok: false, message: "No form was provided"}}
	if (!form.c_name) {return {ok: false, message: "No playlist name was provided"}}
	if (!form.c_mod) {return {ok: false, message: "No mod was provided"}}
	if (!form.c_id) {return {ok: false, message: "No map id was provided"}}
	if (form.c_mod.length != form.c_id.length) {return {ok: false, message: "Mod length != Map length"}}

	for (let i = 0; i < form.c_mod.length; i++) {
		let sanitized_id = sanitize(form.c_id[i], "id")
		if (!sanitized_id.pass) {return {ok: false, message: sanitized_id.details}}
		form.c_id[i] = sanitized_id.obj
	}
	let maps = form.c_mod.map((a, index) => {return {mod_id: form.c_mod[index], mod: form.c_mod[index].substring(0, 2), id: form.c_id[index]}})

	let token = await request.getToken()
	for (let i = 0; i < maps.length; i++) {
		let map_data = await request.getBeatmap(token, maps[i].id)
		if (map_data) {
			let v1 = false
			switch(maps[i].mod) {
				case "HR":
					v1 = await request.v1Beatmap(maps[i].id, 16)
					map_data.cs = map_data.cs * 1.3 > 10 ? 10 : Number((map_data.cs * 1.3).toFixed(1))
					map_data.ar = map_data.ar * 1.4 > 10 ? 10 : Number((map_data.ar * 1.4).toFixed(1))
					map_data.accuracy = map_data.accuracy * 1.4 > 10 ? 10 : Number((map_data.accuracy * 1.4).toFixed(1))
					break
				case "DT":
					v1 = await request.v1Beatmap(maps[i].id, 64)
					map_data.bpm = Math.round(map_data.bpm * 1.5)
					map_data.ar = Number((map_data.ar <= 5 ? (1800-((1800-map_data.ar*120)*2/3))/120 : ((1200-((1200-(map_data.ar-5)*150)*2/3))/150)+5).toFixed(1))
					map_data.accuracy = Number(((79.5-((79.5-6*map_data.accuracy)*2/3))/6).toFixed(1))
					map_data.total_length = Math.round(map_data.total_length / (3 / 2)) // Total length is currently unused by website but au-cas-où
					map_data.hit_length = Math.round(map_data.hit_length / (3 / 2))
					break
				case "EZ":
					v1 = await request.v1Beatmap(maps[i].id, 2)
					map_data.cs = map_data.cs / 2
					map_data.ar = map_data.ar / 2
					map_data.accuracy = map_data.accuracy / 2
					break
			}
			if (v1) {map_data.difficulty_rating = Number(Number(v1[0].difficultyrating).toFixed(2))}
			map_data.total_length = new Date(map_data.total_length * 1000).toISOString().substr(14, 5) // Total length is currently unused by website but au-cas-où
			map_data.hit_length = new Date(map_data.hit_length * 1000).toISOString().substr(14, 5)
			maps[i].data = map_data
		} else {
			return {ok: false, message: "Something went wrong while requesting a map"}
		}
	}

	let pool = {
		name: form.c_name,
		mappack: form.c_mappack,
		maps: maps
	}

	let collection = db.collection("playlists")
	let insertion = await collection.insertOne(pool)
	let end_message = insertion.insertedId ? "created!" : "insertion failed"
	return {ok: true, message: `${form.c_name} ${end_message}`}
}
