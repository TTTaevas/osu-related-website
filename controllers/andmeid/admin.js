exports.main = async (req, res) => {
	res.status(200).render("andmeid/admin", {user: req.auth.user})
}