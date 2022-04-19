function b_required(data) {
	let beatmap = document.createElement("div")
	beatmap.classList.add("b")
	beatmap.setAttribute("b_id", data.id)
	beatmap.setAttribute("size", "r")

	let name = document.createElement("a")
	name.classList.add("name")
	name.setAttribute("href", `/andmeid/beatmaps/${data.id}`)
	name.setAttribute("target", "_blank")

	let song = document.createElement("div")
	song.classList.add("song")

	let artist = document.createElement("span")
	artist.classList.add("artist")
	artist.innerHTML = data.artist
	let title = document.createElement("span")
	title.classList.add("title")
	title.innerHTML = data.title

	song.appendChild(artist)
	song.innerHTML += " - " // User cannot highlight CSS ::after 
	song.appendChild(title)
	name.appendChild(song)

	let difficulty = document.createElement("span")
	difficulty.classList.add("difficulty")
	difficulty.innerHTML = `[${data.difficulty}]`

	name.appendChild(difficulty)
	beatmap.appendChild(name)

	return beatmap
}

function b_small(data) {
	let beatmap = b_required(data)
	beatmap.setAttribute("size", "s")
	return beatmap
}

function b_full(data) {
	let beatmap = b_small(data)
	beatmap.setAttribute("size", "f")
	return beatmap
}
