module.exports = class Roles { // Why even bother with TypeScript?
	constructor(old, add) {
		this.admin = false
		this.referee = false
		this.pooler = false
		this.streamer = false
		this.commentator = false
		this.staff = false
		this.registered_staff = false
		this.player = false
		this.registered_player = false

		let old_values = Object.values(old)
		for (let i = 0; i < old_values.length; i++) {
			if (old_values[i]) {this[Object.keys(old)[i]] = true}
		}
		add.forEach((a) => {if (this[a] != undefined) {this[a] = true}})
	}
}
