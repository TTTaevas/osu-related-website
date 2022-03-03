exports.home = async (req, res) => {
	res.status(200).render("history/home", {user: req.auth.user})
}
