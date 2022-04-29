const util = require('util')

module.exports = class Branch {
	constructor(info, user) {
		if (user !== undefined) {
			this.creator = user ? {
				id: user.id,
				username: user.username
			} : false
			
			setTimeout(() => {
				if (this.branches) console.log(util.inspect(this, false, null, true))
			}, 10000)
		}
		this.body = info
	}

	add(info) {
		let branch = new Branch(info)
		this.branches ? this.branches.push(branch) : this.branches = [branch]
		return branch
	}
}
