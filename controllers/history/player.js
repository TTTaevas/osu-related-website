exports.home = async (req, res) => {
	res.status(200).render("history/player", {user: req.user})
}
