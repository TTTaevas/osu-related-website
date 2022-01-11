const sanitize = require("./sanitizer.js")

async function staff(user, users, db, form) {
	form = san(form)
	let staff_roles = Object.keys(form).filter((key) => {return key == "pooler" || key == "referee" || key == "streamer" || key == "commentator"})
	if (!staff_roles.length) {return {ok: false, message: "No staff role was selected :^)"}}
	if (!form.discord) {return {ok: false, message: "No Discord was provided"}}
	if (!form.experience) {return {ok: false, message: "No experience was provided"}}

	let updated_roles = {roles: user.roles}
	updated_roles.roles.registered_staff = true
	await users.updateOne({_id: user._id}, {$set: updated_roles})

	let reg = {
		id: user.id,
		form: form,
		date: new Date()
	}
	const staff_regs = db.collection("staff_regs")
	const regs = await staff_regs.find().toArray()
	if (regs.find((reg_a) => {return reg_a.user == reg.user})) {
		staff_regs.updateOne({id: user.id}, {$set: reg})
	} else {
		staff_regs.insertOne(reg)
	}

	return {ok: true, message: `You have successfully registered! :D (${String(staff_roles).replaceAll(",", ", ")})`}
}

async function player(user, users, form) {
	console.log("no clue yet lol")
}

function san(form) {
	let sanitized_form = {}
	for (let i = 0; i < Object.keys(form).length; i++) {
		let key = sanitize(Object.keys(form)[i], "string")
		if (!key.pass) {continue}
		let value = sanitize(Object.values(form)[i], "string")
		if (!value.pass) {continue}
		sanitized_form[key.obj] = value.obj

		// I kinda don't wanna allow anyone to create a big-ass form if you see what I mean
		if (i >= 16) {i = Object.keys(form).length}
	}
	return sanitized_form
}

module.exports = {
	staff,
	player
}
