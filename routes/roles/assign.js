module.exports = (router, client, name) => {
	router.all("*", async (req, res, next) => {
		req[name] = {
			client,
			db: client.db()
		}

		req.roles = req.auth.user ?
		(await req[name].db.collection("roles").distinct("roles", {id: req.auth.user.id}))[0] || {} : {}
		// the () is necessary to access the array that is returned
		// the await needs to be within the () for it to do the intended thing

		next()
	})
}
