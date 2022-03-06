exports.home = async (req, res) => {
	res.status(200).render("layer01/rules", {user: req.auth.user, roles: req.roles})
}
