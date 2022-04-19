function s_required(data) {
	let score = document.createElement("div")
	score.classList.add("s")
	score.setAttribute("s_id", data.id)

	let html_data = getDataFromHTML("u", data.player_id, "r")
	if (html_data) score.appendChild(html_data)
		
	if (!html_data) {
		let api_request = api("users", data.player_id, {size: "r", host: score})
		// Check every 1/10 of a second for 2 seconds for HTML data
		if (api_request === null) for (let i = 0; i < 20; i++) {setTimeout(function() {
			if (html_data) return
			html_data = getDataFromHTML("u", data.player_id, "r")
			if (html_data) score.appendChild(html_data)
		}, 100 * i)}
	}

	return score
}

function s_small(data) {
	let score = s_required(data)
	score.setAttribute("size", "s")
	return score
}

function s_full(data) {
	let score = s_small(data)
	score.setAttribute("size", "f")
	return score
}
