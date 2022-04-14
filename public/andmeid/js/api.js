opened_requests = []

function api(type, id, config) {
	if (!id) return console.error(`No valid ID is provided: ${id}`)
	if (isNaN(id)) return console.error(`The ID is invalid: ${id}`)
	if (opened_requests.indexOf(id) > -1) return null

	let xhr = new XMLHttpRequest()
	xhr.open("POST", `/andmeid/${type}`)
	opened_requests.push(id)

	xhr.setRequestHeader("Accept", "application/json")
	xhr.setRequestHeader("Content-Type", "application/json")

	if (config) {
		xhr.onreadystatechange = () => {
			if (xhr.readyState !== 4) return
			opened_requests.splice(opened_requests.indexOf(id), 1)
			display(type[0], JSON.parse(xhr.response).content, config)
		}
	}

	xhr.send(`{"id": ${id}}`)
}

function replaceWithData(type, host) {
	let children = Array.from(host.children)
	let maidens = children.map((c) => c.getAttribute("osu_id")).filter((m) => m)
	maidens.forEach((m) => api(type, m, {size: "r", host, replace: "osu_id"}))
}

function display(type, d, c) {
	if (!c) {c = {}}

	var element
	if (!d) {
		element = document.createElement("p")
		element.classList.add("unsuccessful")
		element.innerHTML = "The requested data does not seem to exist ><"
	} else {
		if (type == "u") {element = c.size == "f" ? u_full(d) : c.size == "s" ? u_small(d) : u_required(d)}
		else if (type == "m") {element = m_required(d)}
		else if (type == "g") {element = g_required(d)}
		else if (type == "s") {element = s_required(d)}
		else { // Unless the user wants to, type shouldn't ever be something else
			element = document.createElement("p")
			element.classList.add("unsuccessful")
			element.innerHTML = "Some weird bug happened, sorry... ><'"
		}
	}

	if (c.return) return element
	if (c.replace) {
		if (c.replace == "osu_id") return c.host.replaceChild(element, c.host.querySelector(`div[osu_id="${d.id}"]`))
		return c.host.replaceChild(element, c.host.lastElementChild)
	}
	c.host.appendChild(element)
}
