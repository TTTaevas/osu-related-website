function g_required(data) {
	let game = document.createElement("div")
	game.classList.add("g")
	game.setAttribute("g_id", data.id)

	game.appendChild(dateTemplate(data.date))

	data.scores.forEach((s) => display("s", s, {host: game}))

	return game
}
