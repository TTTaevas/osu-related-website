const express = require("express")
const router = express.Router()

const { andmeid } = require("../db-clients.js")
require("./roles/assign.js")(router, andmeid, "andmeid")
const validator = require("./validators/andmeid.js")
const check = require("./roles/check.js")


const home = require("../controllers/andmeid/home")
router.get("/", home.main)

const admin = require("../controllers/andmeid/admin")
router.get("/admin", (r,a,n)=>check(r,a,n,["admin"]), admin.main)

const matches = require("../controllers/andmeid/matches")
router.get("/matches", matches.main)
router.get("/matches/:id", matches.specific)
router.post("/matches", validator.id, matches.create)

const users = require("../controllers/andmeid/users")
router.get("/users", users.main)
router.get("/users/:id", users.specific)
router.post("/users", validator.id, users.find)

const games = require("../controllers/andmeid/games")
router.get("/games", games.main)
router.get("/games/:id", games.specific)
router.post("/games", validator.id, games.find)

const beatmaps = require("../controllers/andmeid/beatmaps")
router.get("/beatmaps", beatmaps.main)
router.get("/beatmaps/:id", beatmaps.specific)
router.post("/beatmaps", validator.id, beatmaps.find)

router.get("*", (req, res) => res.status(404).render("andmeid/error", {error: {code: 404, message: "The content you're looking for does not exist"}}))
router.post("*", (req, res) => res.status(404).json({status: false, error: "This route or content does not exist"}))

module.exports = router
