require('dotenv').config()
const { MongoClient } = require("mongodb");

(async () => {
	const auth = new MongoClient(process.env.CONNECTIONSTRING)
	const history = new MongoClient(process.env.REF_CONNECTIONSTRING)

	const clients = [auth, history]
	await Promise.all(clients.map(async c => {await c.connect()}))
	.then(() => {console.log("Connected to the databases!")})

	module.exports = {
		auth,
		history
	}

	const app = require("./main.js")
	app.listen(process.env.PORT || 3000)
})()
