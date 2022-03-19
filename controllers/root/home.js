exports.main = async (req, res) => {
	res.status(200).render("root/home", {user: req.auth.user, roles: req.roles})
}
