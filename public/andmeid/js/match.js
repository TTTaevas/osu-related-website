function m_required(data) {
	let match = document.createElement("div")
	match.classList.add("m")
	match.setAttribute("m_id", data.id)

	let name = document.createElement("a")
	name.setAttribute("class", "name")
	name.setAttribute("href", `https://taevas.xyz/andmeid/matches/${data.id}`)
	name.setAttribute("target", "_blank")
	name.innerHTML = data.name
	match.appendChild(name)

	match.appendChild(dateTemplate(data.date))

	let games = document.createElement("div")
	games.setAttribute("class", "display")
	let triggers_games = triggerTemplate(`games played (${data.games.length})`)
	triggers_games[0].setAttribute("onmousedown", "replaceWithData('games', this.parentNode)")
	triggers_games.forEach((t) => games.appendChild(t))
	data.games.forEach((g) => {
		let game = document.createElement("div")
		game.setAttribute("class", "g invisible")
		game.setAttribute("osu_id", g)
		games.appendChild(game)
	})
	match.appendChild(games)

	return match
}
