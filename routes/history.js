const express = require("express")
const router = express.Router()

const root = require("../controllers/history/root")
router.get("/", root.home)

const referee = require("../controllers/history/referee")
router.get("/referee", referee.home)
router.post("/referee/*", (req, res, next) => {
	if (!req.user || !req.user.roles.admin) {return res.status(403).send("Unauthorized; not an admin")}
	next()
})
router.post("/referee/add", referee.add)
router.post("/referee/addMatches", referee.addMatches)
router.post("/referee/remove", referee.remove)
router.post("/referee/import", referee.import)

const player = require("../controllers/history/player")
router.get("/player", player.home)

router.get("/*", (req, res) => {
	res.status(404).render("history/fourofour")
})

module.exports = router
