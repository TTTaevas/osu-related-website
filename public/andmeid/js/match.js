function m_required(data) {
	let match = document.createElement("div")
	match.classList.add("m")
	match.setAttribute("m_id", data.id)
	match.setAttribute("size", "r")

	let name = document.createElement("a")
	name.classList.add("name")
	name.setAttribute("href", `/andmeid/matches/${data.id}`)
	name.setAttribute("target", "_blank")
	name.innerHTML = data.name
	match.appendChild(name)

	return match
}

function m_small(data) {
	let match = m_required(data)
	match.setAttribute("size", "s")

	let details = document.createElement("div")
	details.classList.add("details")
	details.appendChild(dateTemplate(data.date))
	let count = document.createElement("span")
	count.classList.add("count")
	count.innerHTML = `(${data.players.length} player${data.players.length > 1 ? "s" : ""})`
	details.appendChild(count)
	match.appendChild(details)

	let games = document.createElement("div")
	games.classList.add("display")

	let triggers_games = triggerTemplate(`games played (${data.games.length})`)
	let attribute = triggers_games[0].getAttribute("onclick")
	attribute = attribute ? `${attribute}; replaceWithData('games', this.parentNode)` : "replaceWithData('games', this.parentNode)"
	triggers_games[0].setAttribute("onclick", attribute)
	triggers_games.forEach((t) => games.appendChild(t))
	data.games.forEach((g) => {games.appendChild(osuIDTemplate("g", g, "s"))})
	match.appendChild(games)
	
	return match
}

function m_full(data) {
	let match = m_small(data)
	match.setAttribute("size", "f")
	return match
}
