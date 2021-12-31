module.exports = async function userCheck(client, sesUser, requiredRole) {
	const db = client.db()
	const collection = db.collection("users")

	const findResult = await collection.find({id: sesUser}).toArray()
	const users = await collection.find().toArray()
	// This if statement is not supposed to trigger ever, but that's only in theory
	if (findResult.length >= 2) {console.log(`userCheck's findResult has found ${findResult.length} users with sesUser ${sesUser}`)}

	if (!findResult.length) return {authorized: false, user: false, users: users, collection: collection}
	let user = findResult[0]
	if (requiredRole && !user.roles.admin && !user.roles[requiredRole]) {
		return {authorized: false, user: user, users: users, collection: collection}
	}
	
	return {authorized: true, user: user, users: users, collection: collection, db: db}
}
