const Roles = require("./classes/roles.js")

exports.home = async (req, res) => {
	let regs_col = req.layer01.db.collection("staff_regs")
	let regs = await regs_col.find().toArray()
	for (let i = 0; i < regs.length; i++) {regs[i].user = req.auth.users.array.find((user) => user.id == regs[i].id)}
	res.status(200).render("layer01/staff-regs", {user: req.auth.user, roles: req.roles, regs})
}

exports.update = async (req, res) => {
	let update = await addStaff(req.auth.users.collection, req.layer01.db, req.body)
	console.log(`Adding to staff: ${update.message}`)
	res.redirect("/layer01/staff-regs")
}

async function addStaff(users_col, layer01, form) {
	// Delete the registration
	let deletion = await layer01.collection("staff_regs").deleteOne({id: form.id})
	let message = deletion.deletedCount ? `Deleted staff registration ${form.id} | ` : `Could not delete staff registration ${form.id} | `

	// Update the user's Discord (global information across the website)
	let global_update = await users_col.updateOne({id: form.id}, {$set: {discord: form.discord.substring(0, 40)}})

	// Update the user's roles (LAYER01 exclusive)
	let old_roles = await layer01.collection("roles").findOne({id: form.id})
	old_roles = old_roles == null ? {} : old_roles.roles

	let roles_arr = ["staff"]
	if (form.pooler) {roles_arr.push("pooler")}
	if (form.referee) {roles_arr.push("referee")}
	if (form.streamer) {roles_arr.push("streamer")}
	if (form.commentator) {roles_arr.push("commentator")}

	let new_roles = new Roles(old_roles, roles_arr)
	let update = await layer01.collection("roles").updateOne({id: form.id}, {$set: {id: form.id, roles: new_roles}}, {upsert: true})
	message += update.modifiedCount || roles_update.upsertedCount ? `Added ${form.id} to staff!` : `Could not add ${form.id} to staff`

	return {ok: true, message: message}
}
