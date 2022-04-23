module.exports = (req, res, next, roles) => {

	// If this function is called, then no matter what, being logged in is required
	if (!req.auth.user) {return req.method == "POST" ? res.status(401).json({status: false, error: "Unauthorized; Please login first"})
	: res.status(401).render(`${req.baseUrl.substring(1)}/error`, {error: {code: 401, message: "Unauthorized; Please login first"}})}

	// If no roles are specified, then being logged in is the only requirement
	if (!roles) return next()

	// At least one of the roles specified in `roles` is required
	let user_roles = Object.entries(req.roles).map(r => r[1] ? r[0] : null).filter(r => r)
	for (let i = 0; i < user_roles.length; i++) {if (roles.indexOf(user_roles[i]) != 1) return next()}

	return req.method == "POST" ? res.status(403).json({status: false, error: `Unauthorized; You are not: ${roles}`})
	: res.status(403).render(`${req.baseUrl.substring(1)}/error`, {error: {code: 403, message: `Unauthorized; You are not: ${roles}`}})
}
