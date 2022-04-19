// JSON

function u_required(data) {
	let user = document.createElement("div")
	user.classList.add("u")
	user.setAttribute("u_id", data.id)
	user.setAttribute("size", "r")

	let flag = document.createElement("img")
	flag.classList.add("flag")
	flag.setAttribute("src", `https://osuflags.omkserver.nl/${data.country}-40.png`)
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

	let card = tableTemplate(2)
	card.classList.add("card")

	let pfp_holder = document.createElement("td")
	pfp_holder.setAttribute("rowspan", "2")
	let pfp = document.createElement("img")
	pfp.classList.add("pfp")
	pfp.setAttribute("src", `https://a.ppy.sh/${data.id}`)
	pfp_holder.appendChild(pfp)
	card.firstChild.firstChild.appendChild(pfp_holder)

	let times = user.children.length
	for (let i = 0; i < times; i++) {
		let holder = document.createElement("td")
		holder.appendChild(user.children[0])
		card.firstChild.children[i].appendChild(holder)
	}
	user.appendChild(card)

	let details = document.createElement("div")
	details.classList.add("details")

	if (data.discord) {
		let container_discord = document.createElement("div")
		container_discord.classList.add("container")

		let image_discord = document.createElement("img")
		image_discord.classList.add("icon")
		image_discord.setAttribute("src", "/andmeid/images/discord.svg")
		container_discord.appendChild(image_discord)

		let discord = document.createElement("span")
		discord.classList.add("discord")
		discord.classList.add("copy")
		discord.setAttribute("onclick", "navigator.clipboard.writeText(this.innerHTML)")
		discord.innerHTML = data.discord
		container_discord.appendChild(discord)

		details.appendChild(container_discord)
	}

	if (data.timezone) {
		let container_timezone = document.createElement("div")
		container_timezone.classList.add("container")

		let image_timezone = document.createElement("img")
		image_timezone.classList.add("icon")
		image_timezone.setAttribute("src", "/andmeid/images/clock.svg")
		container_timezone.appendChild(image_timezone)

		let timezone = document.createElement("span")
		timezone.classList.add("timezone")
		timezone.innerHTML = data.timezone
		container_timezone.appendChild(timezone)

		details.appendChild(container_timezone)
	}

	user.appendChild(details)
	return user
}

function u_full(data) {
	let user = u_small(data)
	user.setAttribute("size", "f")

	let displays = document.createElement("div")
	displays.classList.add("displays")

	let matches = document.createElement("div")
	matches.classList.add("display")
	let m_triggers = triggerTemplate(`matches played (${data.matches.length})`)
	m_triggers.forEach((t) => matches.appendChild(t))
	data.matches.forEach((m) => {
		let child = display("m", m, {return: true, size: "f"})
		child.classList.add("invisible")
		matches.appendChild(child)
	})
	displays.appendChild(matches)

	let beatmaps = document.createElement("div")
	beatmaps.classList.add("display")
	let b_triggers = triggerTemplate(`beatmaps mapped (${data.mapped.length})`)
	b_triggers.forEach((t) => beatmaps.appendChild(t))
	data.mapped.forEach((b) => {
		let child = display("b", b, {return: true, size: "r"})
		child.classList.add("invisible")
		beatmaps.appendChild(child)
	})
	displays.appendChild(beatmaps)

	user.appendChild(displays)
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
