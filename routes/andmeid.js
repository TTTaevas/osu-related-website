const express = require("express")
const router = express.Router()

const home = require("../controllers/andmeid/home")
router.get("/", home.main)

router.get("/*", (req, res) => {
	res.status(404).render("andmeid/error", {error: {code: 404, message: "The content you're looking for does not exist"}})
})

module.exports = router
