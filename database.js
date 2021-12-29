require('dotenv').config()
const mongodb = require("mongodb").MongoClient

mongodb.connect(process.env.CONNECTIONSTRING, {useUnifiedTopology: true}, function (e, client) {
	if (e) {console.error(e)}
	module.exports = client
	const app = require("./main.js")
	app.listen(process.env.PORT || 3000)
})
