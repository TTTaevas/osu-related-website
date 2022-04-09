function api(type, id, callback) {
	if (!id) return console.error("No valid ID is provided")
	if (isNaN(id)) return console.error("The ID is invalid")

	let xhr = new XMLHttpRequest()
	xhr.open("POST", `/andmeid/${type}`)

	xhr.setRequestHeader("Accept", "application/json")
	xhr.setRequestHeader("Content-Type", "application/json")

	if (callback) {
		xhr.onreadystatechange = () => {
			if (xhr.readyState !== 4) return
			callback.f(type[0], JSON.parse(xhr.response).content, callback.d)
		}
	}

	xhr.send(`{"id": ${id}}`)
}

function display(type, data, host) {
	let div = document.createElement("div")
	div.setAttribute("class", type)
	let arr = []

	if (!data) {
		let msg = document.createElement("p")
		msg.setAttribute("class", "unsuccessful")
		msg.innerHTML = "Couldn't find the requested data ><"
		div.appendChild(msg)
		return host.appendChild(div)
	}

	switch(type) {
		case "u": // `u` IS FOR USER
			let flag = document.createElement("img")
			flag.setAttribute("class", "flag")
			flag.setAttribute("src", `https://osuflags.omkserver.nl/${data.country}-32.png`)
			flag.setAttribute("alt", data.country)
			arr.push(flag)

			let pfp = document.createElement("img")
			pfp.setAttribute("class", "pfp")
			pfp.setAttribute("src", `https://a.ppy.sh/${data.id}`)
			pfp.setAttribute("alt", "Could not load pfp :c")
			arr.push(pfp)

			let username = document.createElement("a")
			username.setAttribute("class", "username")
			username.setAttribute("href", `https://osu.ppy.sh/u/${data.id}`)
			username.setAttribute("target", "_blank")
			username.innerHTML = data.username
			arr.push(username)

			if (data.discord) {
				let discord = document.createElement("span")
				discord.setAttribute("class", "discord")
				discord.innerHTML = data.discord
				arr.push(discord)
			}

			if (data.timezone) {
				let timezone = document.createElement("span")
				timezone.setAttribute("class", "timezone")
				timezone.innerHTML = data.timezone
				arr.push(timezone)
			}

			let played = document.createElement("div")
			played.setAttribute("class", "display")
			let triggers_played = triggerTemplate(`matches played (${data.matches.length})`)
			triggers_played.forEach((t) => played.appendChild(t))
			data.matches.forEach((m) => {
				let match = matchTemplate(m)
				match.classList.add("invisible")
				played.appendChild(match)
			})
			arr.push(played)

			let mapped = document.createElement("div")
			mapped.setAttribute("class", "display")
			let triggers_mapped = triggerTemplate(`beatmaps mapped (${data.mapped.length})`)
			triggers_mapped.forEach((t) => mapped.appendChild(t))
			data.mapped.forEach((m) => {
				let beatmap = matchTemplate(m)
				beatmap.classList.add("invisible")
				mapped.appendChild(beatmap)
			})
			arr.push(mapped)

			break

		default: // if type is unsupported, proper display is basically impossible
			let msg = document.createElement("p")
			msg.setAttribute("class", "unsuccessful")
			msg.innerHTML = "Something went wrong ><'"
			arr.push(msg)
	}

	arr.forEach((e) => div.appendChild(e))
	host.appendChild(div)
}

function triggerTemplate(text) {
	let show = document.createElement("button")
	show.setAttribute("class", "trigger")
	show.setAttribute("onclick", "showSiblings(this)")
	show.innerHTML = `Show ${text}`

	let hide = document.createElement("button")
	hide.setAttribute("class", "trigger invisible")
	hide.setAttribute("onclick", "showSiblings(this)")
	hide.innerHTML = `Hide ${text}`

	return [show, hide]
}

function dateTemplate(text) { // Already assuming ISO string (YYYY-MM-DDTHH:mm:ss.sssZ)
	let date = document.createElement("span")
	date.setAttribute("class", "date")
	date.innerHTML = `${text.substring(0, 10)} ${text.substring(11, 16)} UTC`

	return date
}

function matchTemplate(data) {
	let div = document.createElement("div")
	div.setAttribute("class", "m")

	let name = document.createElement("a")
	name.setAttribute("class", "m_name")
	name.setAttribute("href", `https://osu.ppy.sh/mp/${data.id}`)
	name.setAttribute("target", "_blank")
	name.innerHTML = data.name
	div.appendChild(name)

	div.appendChild(dateTemplate(data.date))

	let games = document.createElement("div")
	games.setAttribute("class", "display")
	let triggers_games = triggerTemplate(`games played (${data.games.length})`)
	// triggers_games[0].setAttribute("onmousedown", "dealWithTheGamesData()")
	triggers_games.forEach((t) => games.appendChild(t))
	data.games.forEach((g) => {
		let game = document.createElement("div")
		game.setAttribute("class", "g invisible")
		game.setAttribute("game_id", g)
		games.appendChild(game)
	})
	div.appendChild(games)

	return div
}

function showSiblings(e) {
	const siblings = [].slice.call(e.parentNode.children).filter((c) => c != e)
	e.classList.toggle("invisible")
	siblings.forEach((s) => s.classList.toggle("invisible"))
}


