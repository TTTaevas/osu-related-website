const express = require("express")
const router = express.Router()

const login = require("../controllers/root/login")
router.get("/login", login.home)

router.get("/", async (req, res) => {res.render("root/home")})
router.use(function(req, res, next) {res.status(404).render("root/error", {status: {code: 404, reason: "inexistant"}})})

module.exports = router
