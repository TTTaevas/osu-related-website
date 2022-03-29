const util = require('util')

module.exports = class Branch {
	constructor(info, user) {
		if (user) {
			this.creator = {
				id: user.id,
				username: user.username
			}
			setTimeout(() => console.log(util.inspect(this, false, null, true)), 10000)
		}
		this.body = info
	}

	add(info) {
		let branch = new Branch(info)
		if (!this.branches) {this.branches = []}
		this.branches.push(branch)
		return branch
	}
}
