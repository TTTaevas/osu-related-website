const client = require("../../database.js")
const userCheck = require("../../functions/user-check.js")

exports.home = async (req, res) => {
	let check = await userCheck(client, req.session.user)
	res.status(200).render("layer01/home", {user: check.user})
}
