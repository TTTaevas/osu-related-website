const client = require("../../database.js")
const userCheck = require("../../functions/user-check.js")

const sanitize = require("../../functions/sanitizer.js")

exports.home = async (req, res) => {
	let check = await userCheck(client, req.session.user, "admin")
	if (!check.authorized) {return res.status(403).render("layer01/error", {status: {code: 403, reason: "Unauthorized; you shouldn't be there :3c"}})}

	let regs_col = check.db.collection("staff_regs")
	let regs = await regs_col.find().toArray()
	for (let i = 0; i < regs.length; i++) {regs[i].user = check.users.find((user) => user.id == regs[i].id)}
	res.status(200).render("layer01/staff-regs", {user: check.user, regs: regs})
}

exports.update = async (req, res) => {
	let check = await userCheck(client, req.session.user, "admin")
	if (!check.authorized) {return res.status(403).render("layer01/error", {status: {code: 403, reason: "Unauthorized; you shouldn't be there :3c"}})}
	let update = await addStaff(check.db, check.collection, req.body)
	console.log(`Adding to staff: ${update.message}`)
	res.redirect("/layer01/staff-regs")
}

async function addStaff(db, users_col, form) {
	let san_form = sanitize(form, "form")
	if (!san_form.pass) {return {ok: false, message: `Failed sanity check: ${san_form.details}`}}

	form = san_form.obj
	let message = ""

	// Delete the registration
	const staff_regs = db.collection("staff_regs")
	let deletion = await staff_regs.deleteOne({id: form.id})
	message += deletion.deletedCount ? `Deleted staff registration ${form.id} | ` : `Could not delete staff registration ${form.id} | `

	// Add to staff
	const user = await users_col.findOne({id: form.id})
	let updated = {discord: form.discord, roles: user.roles}
	updated.roles.staff = true
	if (form.pooler) {updated.roles.pooler = true}
	if (form.referee) {updated.roles.referee = true}
	if (form.streamer) {updated.roles.streamer = true}
	if (form.commentator) {updated.roles.commentator = true}

	let update = await users_col.updateOne({_id: user._id}, {$set: updated})
	message += update.modifiedCount ? `Added ${user.username} to staff!` : `Could not add ${user.username} to staff`

	return {ok: true, message: message}
}
