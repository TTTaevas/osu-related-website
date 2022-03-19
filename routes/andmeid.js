const express = require("express")
const router = express.Router()

const home = require("../controllers/andmeid/home")
router.get("/", home.main)

module.exports = router
