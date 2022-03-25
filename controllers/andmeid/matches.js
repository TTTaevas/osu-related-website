const v2 = require("../../apis/osu-v2.js")

exports.main = async (req, res) => {
	res.status(200).render("andmeid/matches", {user: req.auth.user})
}

exports.create = async (req, res) => {
	let token = await v2.getToken()
	let match = await v2.getMatch(token, req.body.id)
	res.status(200).json({status: true, content: Boolean(match)})
}
