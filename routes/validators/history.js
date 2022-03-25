const { check, validationResult } = require("express-validator")

const addTournaments = [
	check("add_name")
	.trim()
	.isLength({min: 3, max: 150}),
	check("add_forum").optional({checkFalsy: true})
	.trim()
	.isURL()
	.isLength({min: 0, max: 59}),
	check("add_date")
	.trim()
	.isDate()
	.isLength({min: 0, max: 59}),
	check("add_mp_ids").optional({checkFalsy: true})
	.trim()
	.isLength({min: 0, max: 420}),
	(req, res, next) => {
		const errors = validationResult(req)
		if (!errors.isEmpty()) {return res.status(400).json({errors: errors.array()})}
		next()
	}
]

const removeTournaments = [
	check("remove_name")
	.trim()
	.isLength({min: 3, max: 150}),
	(req, res, next) => {
		const errors = validationResult(req)
		if (!errors.isEmpty()) {return res.status(400).json({errors: errors.array()})}
		next()
	}
]

const addMatches = [
	check("tournament_name")
	.trim()
	.isLength({min: 3, max: 150}),
	check("mp_ids").optional({checkFalsy: true})
	.trim()
	.isLength({min: 0, max: 420}),
	(req, res, next) => {
		const errors = validationResult(req)
		if (!errors.isEmpty()) {return res.status(400).json({errors: errors.array()})}
		next()
	}
]

module.exports = {
	addTournaments,
	removeTournaments,
	addMatches
}
