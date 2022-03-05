require('dotenv').config()
const { MongoClient } = require("mongodb");

(async () => {
	const auth = new MongoClient(process.env.CONNECTIONSTRING)
	const history = new MongoClient(process.env.REF_CONNECTIONSTRING)
	const layer01 = new MongoClient(process.env.LAYER01_CONNECTIONSTRING)

	const clients = [auth, history, layer01]
	await Promise.all(clients.map(async c => {await c.connect()}))
	.then(() => {console.log("Connected to the databases!")})

	let update = await dbUpdater(clients)
	console.log(update)

	module.exports = {
		auth,
		history,
		layer01
	}

	const app = require("./main.js")
	app.listen(process.env.PORT || 3000)
})()


// This function updates the database automatically to the new structure used since approx commit 394292b0
// Note that it doesn't *delete* anything of the old structure (FOR NOW), so code before 394292b0 would still work fine

async function dbUpdater(c) {
	// At first, the history part of the website was supposed to use two separate databases, one for referee, one for player
	// Now they share the same database, meaning referee collections need a `r_` at the start of their name
	// Player history actually didn't exist, but they will have a `p_` at the start of their name

	let history = c[1].db()
	let h_names = ["tournaments", "matches", "players"]

	for (let i = 0; i < h_names.length; i++) {
		let new_col = await history.collection(`r_${h_names[i]}`).find().toArray()
		if (!new_col.length) {
			let old_col = await history.collection(`${h_names[i]}`).find().toArray()
			let insertion = await history.collection(`r_${h_names[i]}`).insertMany(old_col)
			console.log(`(TOURNAMENT HISTORY | REFEREE) ${insertion.insertedCount}/${old_col.length} ${h_names[i]} now using the new database structure!`)
		}
	}

	// Because the relations between the code and the database used to be very poor
	// LAYER01's database was the same as the `auth` one; this is now no longer the case
	// So the code below duplicates everything from `auth` into `layer01`, except for `users` and `sessions`

	let auth = c[0].db()
	let layer01 = c[2].db()
	let l01_names = ["staff_regs", "playlists", "quals_lobbies", "quals_mps", "brackets"]

	for (let i = 0; i < l01_names.length; i++) {
		let new_col = await layer01.collection(`${l01_names[i]}`).find().toArray()
		if (!new_col.length) {
			let old_col = await auth.collection(`${l01_names[i]}`).find().toArray()
			let insertion = await layer01.collection(`${l01_names[i]}`).insertMany(old_col)
			console.log(`(LAYER01) ${insertion.insertedCount}/${old_col.length} ${l01_names[i]} now using the new database structure!`)
		}
	}

	// Roles used to be a part of the user object in `auth`
	// Now each part of the website has its own roles for each user in their own db

	/// history
	let h_roles = await history.collection("roles").find().toArray()
	if (!h_roles.length) {
		let origin_users = await auth.collection("users").find().toArray() // filter to find if a value in an object in an object is true is pain
		let users = origin_users.filter((user) => {if (user.roles) {return user.roles.admin}})
		let counter = 0
		for (let i = 0; i < users.length; i++) {
			let insertion = await history.collection("roles").insertOne({
				id: users[i].id,
				roles: {admin: true}
			})
			if (insertion.insertedId) {counter++}
		}
		console.log(`(TOURNAMENT HISTORY) ${counter}/${users.length} users now using the new authorization system!`)
	}

	return "Database updater finished to run, now running server!"

}
