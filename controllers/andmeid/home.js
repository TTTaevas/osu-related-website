exports.main = async (req, res) => {
	res.status(200).render("andmeid/home", {user: req.auth.user})
}
