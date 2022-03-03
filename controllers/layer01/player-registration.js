const sanitize = require("../../functions/sanitizer.js")
const end_of_regs = new Date(Date.UTC(2022, 0, 31))

exports.home = async (req, res) => {
	let time_now = new Date()
	if (time_now > end_of_regs) {return res.status(403).render("layer01/error", {status: {code: 403, reason: "We are no longer accepting player registrations! Sorry ><"}})}

	if (req.auth.user) {
		let message = null
		if (req.auth.user.roles.pooler) {return res.status(403).render("layer01/error", {status: {code: 403, reason: "Poolers cannot play in the tournament"}})}
		if (req.auth.user.roles.registered_player) {message = "You are already a player, but you can reregister if you want to change your discord/timezone :3c"}
		res.status(200).render("layer01/player-registration", {user: req.auth.user, message: message})
	} else {
		res.redirect("/layer01")
	}
}

exports.create = async (req, res) => {
	let time_now = new Date()
	if (time_now > end_of_regs) {return res.status(403).render("layer01/error", {status: {code: 403, reason: "We are no longer accepting player registrations! Sorry ><"}})}
	if (req.auth.user.roles.pooler) {return res.status(403).render("layer01/error", {status: {code: 403, reason: "Poolers cannot play in the tournament"}})}

	let creation = await createPlayer(req.auth.user, req.auth.users.collection, req.body)
	console.log(`Player creation: ${creation.message}`)
	res.redirect("/layer01/players")
}

async function createPlayer(user, users_col, form) {
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

	let update = await users_col.updateOne({id: user.id}, {$set: info})
	let end_message = update.modifiedCount ? `Registered! Welcome to the tournament, ${user.username}!` : `Sorry ${user.username}, we couldn't register you :(`
	return {ok: true, message: end_message}
}
