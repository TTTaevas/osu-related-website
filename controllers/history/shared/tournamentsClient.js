require('dotenv').config()
const mongodb = require("mongodb").MongoClient

module.exports = async function tournamentsClient(category) {
	let connection_string = category == "referee" ? process.env.REF_CONNECTIONSTRING : process.env.PLA_CONNECTIONSTRING
	const client = new mongodb(connection_string)
	await client.connect()
	const db = client.db()
	const tournaments_collection = db.collection("tournaments")

	return {client: client, db: db, collection: tournaments_collection}
}
