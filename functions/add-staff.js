const sanitize = require("./sanitizer.js")

module.exports = async function addStaff(db, users_col, form) {
	let san_form = sanitize(form, "form")
	if (!san_form.pass) {
		console.log("Failed to add to staff, failed sanity check")
		return false
	}
	form = san_form.obj
	
	// Delete the registration
	const staff_regs = db.collection("staff_regs")
	const deletion = await staff_regs.deleteOne({id: form.id})
	deletion.deletedCount === 1 ? console.log(`Deleted staff registration ${form.id}`) : console.log(`Could not delete staff registration ${form.id}`)

	// Add to staff
	const user = await users_col.findOne({id: form.id})
	let updated = {discord: form.discord, roles: user.roles}
	updated.roles.staff = true
	if (form.pooler) {updated.roles.pooler = true}
	if (form.referee) {updated.roles.referee = true}
	if (form.streamer) {updated.roles.streamer = true}
	if (form.commentator) {updated.roles.commentator = true}
	await users_col.updateOne({_id: user._id}, {$set: updated})
}
