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
	if (regs.find((reg_a) => {return reg_a.user == reg.user})) {
		await staff_regs.updateOne({id: user.id}, {$set: reg})
	} else {
		await staff_regs.insertOne(reg)
	}

	return {ok: true, message: `Registered! (${String(staff_roles).replace(/,/g, ", ")}) | It may take some time for your registration to be looked at`}
}

async function player(user, users, form) {
	console.log("no clue yet lol")
}

module.exports = {
	staff,
	player
}
