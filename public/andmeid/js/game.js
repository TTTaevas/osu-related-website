function g_required(data) {
	let game = document.createElement("div")
	game.classList.add("g")
	game.setAttribute("g_id", data.id)

	game.appendChild(dateTemplate(data.date))

	data.scores.forEach((s) => display("s", s, {host: game}))

	return game
}

function g_small(data) {
	let game = g_required(data)
	game.setAttribute("size", "s")
	return game
}

function g_full(data) {
	let game = g_small(data)
	game.setAttribute("size", "f")
	return game
}

