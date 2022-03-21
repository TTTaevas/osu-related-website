const end_of_regs = new Date(Date.UTC(2022, 0, 31))
const Roles = require("./classes/roles.js")

exports.main = async (req, res) => {
	let time_now = new Date()
	if (time_now > end_of_regs) {return res.status(403).render("layer01/error", {status: {code: 403, reason: "We are no longer accepting player registrations! Sorry ><"}})}

	if (req.auth.user) {
		let message = null
		if (req.roles.pooler) {return res.status(403).render("layer01/error", {status: {code: 403, reason: "Poolers cannot play in the tournament"}})}
		if (req.roles.registered_player) {message = "You are already a player, but you can reregister if you want to change your discord/timezone :3c"}
		res.status(200).render("layer01/player-registration", {user: req.auth.user, roles: req.roles, message})
	} else {
		res.redirect("/layer01")
	}
}

exports.create = async (req, res) => {
	let time_now = new Date()
	if (time_now > end_of_regs) {return res.status(403).render("layer01/error", {status: {code: 403, reason: "We are no longer accepting player registrations! Sorry ><"}})}
	if (req.roles.pooler) {return res.status(403).render("layer01/error", {status: {code: 403, reason: "Poolers cannot play in the tournament"}})}

	let creation = await createPlayer(req.auth.user, req.auth.users.collection, req.layer01.db, req.roles, req.body)
	console.log(`Player creation: ${creation.message}`)
	res.redirect("/layer01/players")
}

async function createPlayer(user, users_col, layer01, roles, form) {
	// Update the user's Discord and Timezone (global information across the website)
	let global_info = {
		discord: form.discord,
		timezone: form.timezone
	}
	let global_update = await users_col.updateOne({id: user.id}, {$set: global_info})

	// Update the user's roles (LAYER01 exclusive)
	let new_roles = new Roles(roles, ["player", "registered_player"])
	let roles_update = await layer01.collection("roles").updateOne({id: user.id}, {$set: {id: user.id, roles: new_roles}}, {upsert: true})

	let end_message = roles_update.modifiedCount || roles_update.upsertedCount ?
	`Registered! Welcome to the tournament, ${user.username}!` : `Sorry ${user.username}, we couldn't register you :(`
	return {ok: true, message: end_message}
}
