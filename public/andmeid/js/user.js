// JSON

function u_required(data) {
	let user = document.createElement("div")
	user.classList.add("u")
	user.setAttribute("u_id", data.id)
	user.setAttribute("size", "r")

	let flag = document.createElement("img")
	flag.classList.add("flag")
	flag.setAttribute("src", `https://osuflags.omkserver.nl/${data.country}-32.png`)
	flag.setAttribute("alt", data.country)
	user.appendChild(flag)

	let name = document.createElement("a")
	name.classList.add("name")
	name.setAttribute("href", `/andmeid/users/${data.id}`)
	name.setAttribute("target", "_blank")
	name.innerHTML = data.username
	user.appendChild(name)

	return user
}

function u_small(data) {
	let user = u_required(data)
	user.setAttribute("size", "s")

	let pfp = document.createElement("img")
	pfp.classList.add("pfp")
	pfp.setAttribute("src", `https://a.ppy.sh/${data.id}`)
	pfp.setAttribute("alt", "Could not load pfp :c")
	user.appendChild(pfp)

	let details = document.createElement("div")
	details.classList.add("details")

	if (data.discord) {
		let discord = document.createElement("span")
		discord.classList.add("discord")
		discord.innerHTML = data.discord
		details.appendChild(discord)
	}

	if (data.timezone) {
		let timezone = document.createElement("span")
		timezone.classList.add("timezone")
		timezone.innerHTML = data.timezone
		details.appendChild(timezone)
	}

	user.appendChild(details)
	return user
}

function u_full(data) {
	let user = u_small(data)
	user.setAttribute("size", "f")

	let sections = [{d: "matches", t: "matches"}, {d: "mapped", t: "beatmaps"}]
	sections.forEach((s) => {
		let element = document.createElement("div")
		element.classList.add("display")
		let triggers_element = triggerTemplate(`${s.t} played (${data[s.d].length})`)
		triggers_element.forEach((t) => element.appendChild(t))
		data[s.d].forEach((x) => {
			let child = display(s.t[0], x, {return: true})
			child.classList.add("invisible")
			element.appendChild(child)
		})
		user.appendChild(element)
	})

	return user
}

// HTML

function u_required_HTML(div) {
	let user = document.createElement("div")
	user.classList.add("u")
	user.setAttribute("u_id", div.getAttribute("u_id"))
	user.setAttribute("size", "r")

	user.appendChild(div.getElementsByClassName("flag")[0])
	user.appendChild(div.getElementsByClassName("name")[0])

	return user
}

function u_small_HTML(div) {
	let user = u_required_HTML(div)
	user.appendChild(div.getElementsByClassName("pfp")[0])
	user.appendChild(div.getElementsByClassName("details")[0])
	return user
}

function u_full_HTML(div) {
	let user = u_small_HTML(div)
	let displays = div.querySelectorAll(`div[u_id=${div.getAttribute("u_id")}] > .display`)
	displays.forEach((d) => user.appendChild(d))
	return user
}
