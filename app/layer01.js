const express = require("express")
const router = express.Router()

const client = require("../database.js")
const userCheck = require("../functions/user-check.js")

const admin = require("../functions/admin.js")
const formHandler = require("../functions/form-handler.js")
const addStaff = require("../functions/add-staff.js")

router.get("/", async (req, res) => {
	let check = await userCheck(client, req.session.user)
	res.status(200).render("layer01/home", {user: check.user})
})

router.get("/login", async (req, res) => {
	const sessionHandler = require("./functions/session-handler.js")
	let status = await sessionHandler(req, client)
	status.ok ? res.status(200).redirect("/layer01") : res.status(201).render("layer01/login", {status: status})
})

router.get("/rules", async (req, res) => {
	let check = await userCheck(client, req.session.user)
	res.status(200).render("layer01/rules", {user: check.user})
})


router.route("/playlists")
.get(async (req, res) => {
	let check = await userCheck(client, req.session.user)
	let playlists_col = check.db.collection("playlists")
	let pools = await playlists_col.find().toArray()
	res.status(200).render("layer01/playlists", {user: check.user, playlists: pools})
})
.post(async (req, res) => {
	let check = await userCheck(client, req.session.user, "admin")
	if (!check.authorized) {return res.status(403).render("layer01/error", {status: {code: 403, reason: "Unauthorized; you shouldn't be there :3c"}})}
	let form = await formHandler.playlist(check.db, req.body)
	res.redirect("/layer01/playlists")
})


router.route("/player-registration")
.get(async (req, res) => {
	let check = await userCheck(client, req.session.user)
	let message = null
	if (check.user) {
		if (check.user.roles.pooler) {return res.status(403).render("layer01/error", {status: {code: 403, reason: "Poolers cannot play in the tournament"}})}
		if (check.user.roles.registered_player) {message = "You are already a player, but you can reregister if you want to change your discord/timezone :3c"}
		res.status(200).render("layer01/player-registration", {user: check.user, message: message})
	} else {
		res.redirect("/layer01")
	}
})
.post(async (req, res) => {
	let check = await userCheck(client, req.session.user)
	if (!check.user) {return res.status(403).render("layer01/error", {status: {code: 403, reason: "Probably not logged in"}})}
	let form = await formHandler.player(check.user, check.collection, req.body)
	res.redirect("/layer01/players")
})


router.route("/players")
.get(async (req, res) => {
	let check = await userCheck(client, req.session.user)
	let players = check.users.filter((user) => {return user.roles.player})
	players = players.sort((a, b) => {return a.rank - b.rank}) // sort by rank
	res.status(200).render("layer01/players", {user: check.user, players: players})
})
.post(async (req, res) => {
	let check = await userCheck(client, req.session.user, "admin")
	if (!check.authorized) {return res.status(403).render("layer01/error", {status: {code: 403, reason: "Unauthorized; you shouldn't be there :3c"}})}
	admin.updatePlayers(check.users, check.collection)
	res.redirect("/layer01/players")
})


router.route("/staff-registration")
.get(async (req, res) => {
	let check = await userCheck(client, req.session.user)
	let message = null
	if (check.user) {
		if (check.user.roles.registered_staff) {message = "You have already registered as staff, but feel free to reregister if you need to change something :3"}
		if (check.user.roles.staff) {message = "You are already staff! You should ask Taevas if you want to change something :3c"}
		res.status(200).render("layer01/staff-registration", {user: check.user, message: message})
	} else {
		res.redirect("/layer01")
	}
})
.post(async (req, res) => {
	let check = await userCheck(client, req.session.user)
	if (!check.user) {return res.status(403).render("layer01/error", {status: {code: 403, reason: "Probably not logged in"}})}
	let form = await formHandler.staff(check.user, check.collection, check.db, req.body)
	res.status(200).render("layer01/staff-registration", {user: check.user, message: form.message})
})


router.route("/staff-regs")
.get(async (req, res) => {
	let check = await userCheck(client, req.session.user, "admin")
	if (!check.authorized) {return res.status(403).render("layer01/error", {status: {code: 403, reason: "Unauthorized; you shouldn't be there :3c"}})}

	let regs_col = check.db.collection("staff_regs")
	let regs = await regs_col.find().toArray()
	for (let i = 0; i < regs.length; i++) {regs[i].user = check.users.find((user) => user.id == regs[i].id)}
	res.status(200).render("layer01/staff-regs", {user: check.user, regs: regs})
})
.post(async (req, res) => {
	let check = await userCheck(client, req.session.user, "admin")
	if (!check.authorized) {return res.status(403).render("layer01/error", {status: {code: 403, reason: "Unauthorized; you shouldn't be there :3c"}})}
	await addStaff(check.db, check.collection, req.body)
	res.redirect("/layer01/staff-regs")
})


// 404
router.get("/*", (req, res) => {
	res.status(404).render("layer01/fourofour")
})

module.exports = router
