require('dotenv').config()
const { MongoClient } = require("mongodb");

(async () => {
	console.time("Connected to the databases")
	const auth = new MongoClient(process.env.CONNECTIONSTRING)
	const history = new MongoClient(process.env.REF_CONNECTIONSTRING)
	const layer01 = new MongoClient(process.env.LAYER01_CONNECTIONSTRING)

	const clients = [auth, history, layer01]
	await Promise.all(clients.map(async c => {await c.connect()}))
	.then(() => {console.timeEnd("Connected to the databases")})

	// let update = await dbUpdater(clients)
	// console.log(update)

	module.exports = {
		auth,
		history,
		layer01
	}

	console.time("Server up and running")
	const app = require("./main.js")
	app.listen(process.env.PORT || 3000, () => console.timeEnd("Server up and running"))
})()


// This function updates the database automatically to the new structure used since approx commit 394292b0

async function dbUpdater(c) {
	let safe_to_delete = true

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
			if (insertion.insertedCount < old_col.length) {safe_to_delete = false}
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
			if (insertion.insertedCount < old_col.length) {safe_to_delete = false}
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
		if (counter < users.length) {safe_to_delete = false}
	}

	/// referee
	let l01_roles = await layer01.collection("roles").find().toArray()
	if (!l01_roles.length) {
		let users = await auth.collection("users").find().toArray()
		let counter = 0
		for (let i = 0; i < users.length; i++) {
			let insertion = await layer01.collection("roles").insertOne({
				id: users[i].id,
				roles: users[i].roles
			})
			if (insertion.insertedId) {counter++}
		}
		console.log(`(LAYER01) ${counter}/${users.length} users now using the new authorization system!`)
		if (counter < users.length) {safe_to_delete = false}
	}

	// Now in theory, it is safe to clean the database by deleting the stuff
	// used in the old code but not used in the new code anymore
	if (!safe_to_delete) {return `\nEven though the database updater finished to run, it was not able to update everything...
Make sure to check out what went wrong before running the server/database updater again!`}
	
	/// Drop/Delete the old tournament history referee collections
	let h_deleted = []
	for (let i = 0; i < h_names.length; i++) {try{
		let deletion = await history.collection(h_names[i]).drop()
		if (deletion) {h_deleted.push(h_names[i])}
	} catch {console.log(`(TOURNAMENT HISTORY) Could not delete ${h_names[i]}`)}}
	if (h_deleted.length) {console.log(`(TOURNAMENT HISTORY) ${h_deleted} collections have been deleted!`)}

	/// Drop/Delete the old LAYER01 collections in the auth database
	let l01_deleted = []
	for (let i = 0; i < l01_names.length; i++) {try{
		let deletion = await auth.collection(l01_names[i]).drop()
		if (deletion) {l01_deleted.push(l01_names[i])}
	} catch {console.log(`(LAYER01 auth db) Could not delete ${l01_names[i]}`)}}
	if (l01_deleted.length) {console.log(`(LAYER01 auth db) ${l01_deleted} collections have been deleted!`)}

	// Strip user objects of their legacy LAYER01 roles
	let users_stripped_count = 0
	let users_not_stripped_count = 0
	let users = await auth.collection("users").find().toArray()
	for (let i = 0; i < users.length; i++) {if (users[i].roles) {
		delete users[i].roles
		let stripping = await auth.collection("users").replaceOne({_id: users[i]._id}, users[i])
		if (stripping.modifiedCount) {users_stripped_count++}
	} else {users_not_stripped_count++}}
	console.log(`(auth db) Stripped ${users_stripped_count}/${users.length} of their legacy LAYER01 roles! (${users_not_stripped_count} users didn't have them)`)

	return "Database updater finished to run, now running server!"
}
