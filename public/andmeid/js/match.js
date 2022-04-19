function m_required(data) {
	let match = document.createElement("div")
	match.classList.add("m")
	match.setAttribute("m_id", data.id)

	let name = document.createElement("a")
	name.classList.add("name")
	name.setAttribute("href", `/andmeid/matches/${data.id}`)
	name.setAttribute("target", "_blank")
	name.innerHTML = data.name
	match.appendChild(name)

	match.appendChild(dateTemplate(data.date))

	let games = document.createElement("div")
	games.classList.add("display")

	let triggers_games = triggerTemplate(`games played (${data.games.length})`)
	let attribute = triggers_games[0].getAttribute("onclick")
	attribute = attribute ? `${attribute}; replaceWithData('games', this.parentNode)` : "replaceWithData('games', this.parentNode)"
	triggers_games[0].setAttribute("onclick", attribute)
	triggers_games.forEach((t) => games.appendChild(t))
	data.games.forEach((g) => {
		let game = document.createElement("div")
		game.classList.add("g")
		game.classList.add("invisible")
		game.setAttribute("osu_id", g)
		games.appendChild(game)
	})
	match.appendChild(games)

	return match
}

function m_small(data) {
	let match = m_required(data)
	match.setAttribute("size", "s")
	return match
}

function m_full(data) {
	let match = m_small(data)
	match.setAttribute("size", "f")
	return match
}
