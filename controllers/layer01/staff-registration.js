const client = require("../../database.js")
const userCheck = require("../../functions/user-check.js")

const sanitize = require("../../functions/sanitizer.js")

exports.home = async (req, res) => {
	let check = await userCheck(client, req.session.user)
	let message = null
	if (check.user) {
		if (check.user.roles.registered_staff) {message = "You have already registered as staff, but feel free to reregister if you need to change something :3"}
		if (check.user.roles.staff) {message = "You are already staff! You should ask Taevas if you want to change something :3c"}
		res.status(200).render("layer01/staff-registration", {user: check.user, message: message})
	} else {
		res.redirect("/layer01")
	}
}

exports.update = async (req, res) => {
	let check = await userCheck(client, req.session.user)
	if (!check.user) {return res.status(403).render("layer01/error", {status: {code: 403, reason: "Probably not logged in"}})}
	let update = await staffUpdate(check.user, check.collection, check.db, req.body)
	console.log(`Staff reg: ${update.message}`)
	res.status(200).render("layer01/staff-registration", {user: check.user, message: update.message})
}

async function staffUpdate(user, users, db, form) {
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

	let operation = regs.find((reg_a) => {return reg_a.id == reg.id}) ?
	await staff_regs.updateOne({id: user.id}, {$set: reg}) : await staff_regs.insertOne(reg)
	let message = operation.insertedId ? 
	`Thanks for registering as staff, ${user.username}! (${String(staff_roles).replace(/,/g, ", ")}) | It may take some time for your registration to be looked at` : operation.modifiedCount ?
	`Your registration has been changed, ${user.username} (${String(staff_roles).replace(/,/g, ", ")})` :
	`Your staff registration could not be changed for some reason, ${user.username} (${String(staff_roles).replace(/,/g, ", ")})` // Shouldn't happen

	return {ok: true, message: message}
}