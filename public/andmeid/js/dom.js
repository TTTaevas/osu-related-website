function showSiblings(e) {
	const siblings = [].slice.call(e.parentNode.children).filter((c) => c != e)
	e.classList.toggle("invisible")
	siblings.forEach((s) => s.classList.toggle("invisible"))
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

function tableTemplate(rows) {
	let table = document.createElement("table")
	let tbody = document.createElement("tbody")
	for (let i = 0; i < rows; i++) {
		let row = document.createElement("tr")
		tbody.appendChild(row)
	}
	table.appendChild(tbody)
	return table
}

function getDataFromHTML(type, id, size) {
	var result
	let sizes = ["f", "s", "r"] // x, y (x > y)
	sizes = sizes.slice(0, sizes.indexOf(size) + 1)

	sizes.forEach((s) => {
		let attempt = document.querySelector(`div[${type}_id='${id}'][size=${s}]`)
		if (attempt) return result = attempt.cloneNode(true) // return to interrupt forEach
	})
	if (!result) return false

	if (type == "u") return size == "f" ? u_full_HTML(result) : size == "s" ? u_small_HTML(result) : u_required_HTML(result)
}
