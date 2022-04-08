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

			// WIP, LITERALLY IMPOSSIBLE TO IMPLEMENT UNTIL FURTHER BACKEND WORK IS DONE

			let played = document.createElement("div")
			played.setAttribute("class", "display")
			let trigger_played = document.createElement("button")
			trigger_played.setAttribute("class", "trigger")
			trigger_played.innerHTML = "Matches played"
			played.appendChild(trigger_played)
			arr.push(played)

			let mapped = document.createElement("div")
			mapped.setAttribute("class", "display")
			let trigger_mapped = document.createElement("button")
			trigger_mapped.setAttribute("class", "trigger")
			trigger_mapped.innerHTML = "Beatmaps mapped"
			mapped.appendChild(trigger_mapped)
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
