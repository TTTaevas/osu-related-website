exports.main = async (req, res) => {
	res.status(200).render("turniir/home", {user: req.auth.user})
}
