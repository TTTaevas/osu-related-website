require('dotenv').config()
const { MongoClient } = require("mongodb");

(async () => {
	console.time("Connected to the databases")
	const clients = ["AUTH", "HISTORY", "LAYER01", "ANDMEID", "TURNIIR"]
	await Promise.all(clients.map(async (c) => {
		if (process.env[`DB_${c}`]) {
			const client = new MongoClient(process.env[`DB_${c}`])
			exports[c.toLowerCase()] = client
			await client.connect()
		} else {console.error(`Couldn't find a connection string for ${c} in the environment variables...`)}
	}))
	.then(() => {console.timeEnd("Connected to the databases")})

	console.time("Server up and running")
	const app = require("./main.js")
	app.listen(process.env.PORT || 3000, () => console.timeEnd("Server up and running"))
})()
