exports.main = async (req, res) => {
	res.status(200).render("history/player", {user: req.auth.user})
}
