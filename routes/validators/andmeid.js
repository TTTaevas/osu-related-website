const { check, validationResult } = require("express-validator")

const id = [
	check("id")
	.isLength({min: 2, max: 9})
	.isNumeric(),
	(req, res, next) => {
		const errors = validationResult(req)
		if (!errors.isEmpty()) {return res.status(400).json({status: false, error: "Bad request"})}
		next()
	}
]

module.exports = {
	id
}
