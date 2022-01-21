const sanitize = require("./sanitizer.js")

async function staff(user, users, db, form) {
	let sanitized_form = sanitize(form, "form")
	if (!sanitized_form.pass) {return {ok: false, message: "Something seems to have gone wrong very wrong ><"}}
	form = sanitized_form.obj

	let staff_roles = Object.keys(form).filter((key) => {return key == "pooler" || key == "referee" || key == "streamer" || key == "commentator"})
	if (!staff_roles.length) {return {ok: false, message: "No staff role was selected :^)"}}
	if (!form.discord) {return {ok: false, message: "No Discord was provided"}}
	if (!form.experience) {return {ok: false, message: "No experience was provided"}}

	let updated = {roles: user.roles}
	updated.roles.registered_staff = true
	await users.updateOne({_id: user._id}, {$set: updated})

	let reg = {
		id: user.id,
		form: form,
		date: new Date()
	}
	const staff_regs = db.collection("staff_regs")
	const regs = await staff_regs.find().toArray()
	if (regs.find((reg_a) => {return reg_a.id == reg.id})) {
		console.log(`Updating staff reg ${reg.id}`)
		await staff_regs.updateOne({id: user.id}, {$set: reg})
	} else {
		console.log(`Inserting staff reg ${reg.id}`)
		await staff_regs.insertOne(reg)
	}

	return {ok: true, message: `Registered! (${String(staff_roles).replace(/,/g, ", ")}) | It may take some time for your registration to be looked at`}
}

async function player(user, users, form) {
	let sanitized_form = sanitize(form, "form")
	if (!sanitized_form.pass) {return {ok: false, message: "Something seems to have gone wrong very wrong ><"}}
	form = sanitized_form.obj

	if (!form.discord) {return {ok: false, message: "No Discord was provided"}}
	if (!form.timezone) {return {ok: false, message: "No timezone was provided"}}

	let info = {
		roles: user.roles,
		discord: form.discord.substring(0, 40),
		timezone: form.timezone.substring(0, 15)
	}
	info.roles.registered_player = true
	info.roles.player = true

	await users.updateOne({id: user.id}, {$set: info})
	console.log(`(${user.id}) ${user.username} just registered as a player!`)
	return {ok: true, message: `Registered! Welcome to the tournament, ${user.username}!`} // note that this message currently cannot be shown
}

async function playlist(db, form) {
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

	const request = require("./osu-requests.js")
	let token = await request.getToken()
	for (let i = 0; i < maps.length; i++) {
		let map_data = await request.getBeatmap(token, maps[i].id)
		if (map_data) {
			maps[i].data = map_data
		} else {
			return {ok: false, message: "Something went wrong while requesting a map"}
		}
	}

	let pool = {
		name: form.c_name,
		maps: maps
	}

	let collection = db.collection("playlists")
	await collection.insertOne(pool)
	console.log(`The following playlist has been added: ${form.c_name}`)
	return {ok: true, message: `Playlist created!`}
}

module.exports = {
	staff,
	player,
	playlist
}
