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

			setTimeout(() => cleanDB(c, client), 1000)
		} else {console.error(`Couldn't find a connection string for ${c} in the environment variables...`)}
	}))
	.then(() => {console.timeEnd("Connected to the databases")})

	console.time("Server up and running")
	const app = require("./main.js")
	app.listen(process.env.PORT || 3000, () => console.timeEnd("Server up and running"))
})()

async function cleanDB(name, client) {
	// Sometimes, when a lot of data is sent, the same element may get inserted into the DB multiple times at the same time
	// Whenever the server restarts, this function is run to remove any potential duplicate from the DB
	// Note: A duplicate is something that shares the same `id`

	let db = client.db()
	let collections = await db.listCollections().toArray()
	collections.forEach(async (c) => {
		let col = db.collection(c.name)

		// `result` is shamelessly stolen from https://www.statology.org/mongodb-find-duplicates/
		// I'll admit I barely understand how this works, but at least it works perfectly fine
		let result = await col.aggregate([
			{"$group": {"_id": "$id", "count": {"$sum": 1}}},
			{"$match": {"_id": {"$ne": null}, "count": {"$gt": 1}}}, 
			{"$project": {"id": "$_id", "_id": 0}}
		]).toArray()

		if (result.length) {
			console.info(`FOUND DUPLICATES, CLEANING UP: ${name}.${c.name}`, result)
			result.forEach(async (r) => {
				let duplicates = (await col.find(r).toArray()).slice(1) // Do not delete the original (first)
				duplicates.forEach(async (d) => {
					let deletion = await col.deleteOne(d)
					if (deletion.deletedCount < 1) console.error(`Failed to clean from ${name}.${c.name}:`, result)
				})
			})
		}
	})
}
