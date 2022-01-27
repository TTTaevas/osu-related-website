module.exports = async function userCheck(client, sesUser, requiredRole) {
	const db = client.db()
	const collection = db.collection("users")

	const users = await collection.find().toArray()
	const user = users.find((u) => {return u.id == sesUser})

	if (!user) return {authorized: false, user: false, users: users, collection: collection, db: db}
	if (requiredRole && !user.roles.admin && !user.roles[requiredRole]) {
		return {authorized: false, user: user, users: users, collection: collection, db: db}
	}
	
	return {authorized: true, user: user, users: users, collection: collection, db: db}
}
