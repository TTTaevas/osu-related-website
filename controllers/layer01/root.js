exports.home = async (req, res) => {
	res.status(200).render("layer01/home", {user: req.user})
}
