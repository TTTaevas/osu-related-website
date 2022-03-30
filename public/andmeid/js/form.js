// Creating and modifying the form properly

function addMatch(n, position) {
	const div_matches = document.getElementById("matches")
	let matches = document.getElementsByClassName("match")

	for (let i = 0; i < n; i++) {
		let parent = document.createElement("div")
		parent.setAttribute("class", "match")

		let new_match = document.createElement("input")
		new_match.setAttribute("type", "text")
		new_match.setAttribute("class", "match_id")
		new_match.setAttribute("name", "matches")
		new_match.setAttribute("placeholder", "Match ID")
		new_match.setAttribute("onclick", "this.select()")
		new_match.setAttribute("onblur", "sendId('matches', this.value)")

		parent.appendChild(new_match)
		if (position == undefined || (!matches || matches[position] == undefined)) {
			div_matches.appendChild(parent)
		} else {
			div_matches.insertBefore(parent, matches[position])
		}
	}

	fixButtonsIndex(div_matches)
}

function addMap(n, position) {
	const div_maps = document.getElementById("mappool")
	let maps = document.getElementsByClassName("map")
	let elements = ["mod_id", "map_id"]

	for (let i = 0; i < n; i++) { // fun fact, `maps.length` changes with each iteration
		let new_map = document.createElement("div")
		new_map.setAttribute("class", "map")

		elements.forEach((a) => {
			let new_element = document.createElement("input")
			new_element.setAttribute("type", "text")
			new_element.setAttribute("class", a)
			new_element.setAttribute("name", `maps[${maps.length}][${a}]`)
			new_element.setAttribute("placeholder", a == "mod_id" ? "Mod ID" : "Beatmap difficulty ID")
			new_element.setAttribute("onclick", "this.select()")

			if (a == "mod_id") {
				let map = maps[(position || maps.length) - 1]
				if (maps[maps.length - 1]) {
					map = map.getElementsByClassName("mod_id")[0]
					let mod = map.value.replace(/[0-9]/g, '')
					let number = Number(map.value.replace(/[^0-9]/g, ""))

					if (position != undefined) {
						new_element.value = map.value.replace(number, number + 1)
					} else if (mod == "NM") {
						new_element.value = number == 4 ? "HD1" : map.value.replace(number, number + 1)
					} else {
						let mods = ["HD", "HR", "DT", "FM", "TB"]
						let index = mods.indexOf(mod)
						new_element.value = number == 2 ? index == mods.length - 1 ? map.value.replace(number, number + 1) : `${mods[index + 1]}1` : map.value.replace(number, number + 1)
					}

				} else {new_element.value = "NM1"}
			} // else {new_element.setAttribute("onblur", "sendId('beatmaps', this.value)")}

			new_map.appendChild(new_element)
		})

		if (position == undefined || (!maps || maps[position] == undefined)) {
			div_maps.appendChild(new_map)
		} else {
			div_maps.insertBefore(new_map, maps[position])
		}
	}

	for (let i = 0; i < maps.length; i++) {
		elements.forEach((a) => maps[i].getElementsByClassName(a)[0].setAttribute("name", `maps[${i}][${a}]`))
	}

	fixButtonsIndex(div_maps)
}

function fixButtonsIndex(parent) {
	let type = parent.id == "matches" ? "Match" : "Map"
	Array.from(parent.getElementsByClassName(type.toLowerCase())).forEach((e) => Array.from(e.getElementsByClassName("index")).forEach((i) => e.removeChild(i)))

	let elements = parent.getElementsByClassName(type.toLowerCase())
	for (let i = 0; i < elements.length; i++) {
		let index = document.createElement("div")
		index.innerHTML = i + 1
		index.setAttribute("class", "index")
		index.setAttribute("onmouseover", "this.innerHTML = '+'"); index.setAttribute("onmouseout", `this.innerHTML = ${i + 1}`)
		index.setAttribute("onclick", `add${type}(1, ${i+1})`)
		elements[i].insertBefore(index, elements[i].firstChild)
	}
}

function initForm() {
	addMatch(8)
	addMap(10)
}

// Send IDs in form before form submission for lesser wait time

function sendId(type, id) {
	if (!id || id.length < 2) return
	if (isNaN(id)) return

	let xhr = new XMLHttpRequest()
	xhr.open("POST", `/andmeid/${type}`)

	xhr.setRequestHeader("Accept", "application/json")
	xhr.setRequestHeader("Content-Type", "application/json")

	xhr.send(`{"id": ${id}}`)
}
