const { check, validationResult } = require("express-validator")

const createPlaylist = [
	check("c_name")
	.isLength({min: 1, max: 65}),
	check("c_mappack").optional({checkFalsy: true})
	.isURL()
	.isLength({min: 4, max: 100}),
	check("c_mod").isArray(),
	check("c_mod.*")
	.isLength({min: 2, max: 5}),
	check("c_id").isArray(),
	check("c_id.*")
	.isLength({min: 2, max: 9})
	.isNumeric(),
	(req, res, next) => {
		const errors = validationResult(req)
		if (!errors.isEmpty()) {return res.status(400).render("layer01/error", {status: {code: 400, reason: "Bad request"}})}
		next()
	}
]

const createPlayer = [
	check("discord")
	.isLength({min: 5, max: 42}),
	check("timezone")
	.isLength({min: 2, max: 20}),
	(req, res, next) => {
		const errors = validationResult(req)
		if (!errors.isEmpty()) {return res.status(400).render("layer01/error", {status: {code: 400, reason: "Bad request"}})}
		next()
	}
]

const staffReg = [
	check("discord")
	.isLength({min: 5, max: 42}),
	check("experience")
	.isLength({min: 2, max: 727}),
	(req, res, next) => {
		const errors = validationResult(req)
		if (!errors.isEmpty()) {return res.status(400).render("layer01/error", {status: {code: 400, reason: "Bad request"}})}
		next()
	}
]

const addStaff = [
	check("id")
	.isLength({min: 1, max: 10})
	.isNumeric(),
	(req, res, next) => {
		const errors = validationResult(req)
		if (!errors.isEmpty()) {return res.status(400).render("layer01/error", {status: {code: 400, reason: "Bad request"}})}
		next()
	}
]

const qualsCreate = [
	check("c_prefix")
	.isLength({min: 1, max: 10}),
	check("c_min")
	.isLength({min: 1, max: 3})
	.isNumeric(),
	check("c_max")
	.isLength({min: 1, max: 3})
	.isNumeric(),
	(req, res, next) => {
		const errors = validationResult(req)
		if (!errors.isEmpty()) {return res.status(400).render("layer01/error", {status: {code: 400, reason: "Bad request"}})}
		next()
	}
]

const qualsJoin = [
	check("p_lobby")
	.isLength({min: 2, max: 15}),
	(req, res, next) => {
		const errors = validationResult(req)
		if (!errors.isEmpty()) {return res.status(400).render("layer01/error", {status: {code: 400, reason: "Bad request"}})}
		next()
	}
]

const qualsRef = [
	check("r_lobbies")
	.isLength({min: 1, max: 727}),
	(req, res, next) => {
		const errors = validationResult(req)
		if (!errors.isEmpty()) {return res.status(400).render("layer01/error", {status: {code: 400, reason: "Bad request"}})}
		next()
	}
]

const qualsResults = [
	check("new_mplink")
	.isLength({min: 10, max: 50})
	.isURL(),
	(req, res, next) => {
		const errors = validationResult(req)
		if (!errors.isEmpty()) {return res.status(400).render("layer01/error", {status: {code: 400, reason: "Bad request"}})}
		next()
	}
]

const matchCreate = [
	check("c_bracket_name")
	.isLength({min: 3, max: 40}),
	check("c_id").isArray(),
	check("c_id.*")
	.isLength({min: 1, max: 4}),
	check("c_player_1").isArray(),
	check("c_player_1.*")
	.isLength({min: 3, max: 40}),
	check("c_player_2").isArray(),
	check("c_player_2.*")
	.isLength({min: 3, max: 40}),
	check("c_type").isArray(),
	check("c_type.*")
	.isLength({min: 2, max: 3}),
	(req, res, next) => {
		const errors = validationResult(req)
		if (!errors.isEmpty()) {return res.status(400).render("layer01/error", {status: {code: 400, reason: "Bad request"}})}
		next()
	}
]

const matchStaff = [
	check("act")
	.isLength({min: 2, max: 4}),
	check("matches")
	.isLength({min: 2, max: 100}),
	(req, res, next) => {
		const errors = validationResult(req)
		if (!errors.isEmpty()) {return res.status(400).render("layer01/error", {status: {code: 400, reason: "Bad request"}})}
		next()
	}
]

module.exports = {
	createPlaylist,
	createPlayer,
	staffReg,
	addStaff,
	qualsCreate,
	qualsJoin,
	qualsRef,
	qualsResults,
	matchCreate,
	matchStaff
}
