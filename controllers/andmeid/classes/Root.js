module.exports = class Root {
	constructor(user, info) {
		this.initiator = {
			id: user.id,
			username: user.username
		}
		this.route = [info]
	}

	add(info) {
		this.route.push({
			type: info.type,
			id: info.id
		})
	}

	log() {
		console.log(`[ANDMEID] Root by ${this.initiator.id} | ${this.initiator.username}
${this.route.map((r, i) => { // pardon the poor formating, Template literals do need that for cool logging
			let str = String(i+1) + ". " + r.type + " " + String(r.id)
			str += i+1 == this.route.length ? " (was already in database)" : "\n"
			return str
})}`)
	}
}
