const express = require("express")
const router = express.Router()

const home = require("../controllers/root/home")
router.get("/", home.main)

const login = require("../controllers/root/login")
router.get("/login", login.home)

router.use((req, res) => res.status(404).render("root/error", {status: {code: 404, reason: "inexistant"}}))

module.exports = router
