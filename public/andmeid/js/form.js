// Creating and modifying the form properly

function addMatch(n, position) {
	const div_matches = document.getElementById("matches")
	let matches = document.getElementsByClassName("match")

	for (let i = 0; i < n; i++) {
		let new_match = document.createElement("input")
		new_match.setAttribute("type", "text")
		new_match.setAttribute("class", "match")
		new_match.setAttribute("name", "matches")
		new_match.setAttribute("onblur", "sendId('matches', this.value)")

		if (position == undefined || (!matches || matches[position] == undefined)) {
			div_matches.appendChild(new_match)
		} else {
			div_matches.insertBefore(new_match, matches[position])
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

			if (a == "mod_id") {
				let map = maps[(position || maps.length) - 1]
				if (maps[maps.length - 1]) {
					map = map.getElementsByClassName("mod_id")[0]
					let mod = map.value.replace(/[0-9]/g, '')
					let number = Number(map.value.replace(/[^0-9]/g, ""))

					if (mod == "NM") {
						new_element.value = number == 4 ? "HD1" : map.value.replace(number, number + 1)
					} else {
						let mods = ["HD", "HR", "DT", "FM", "TB"]
						let index = mods.indexOf(mod)
						new_element.value = number == 2 ? index == mods.length - 1 ? map.value.replace(number, number + 1) : `${mods[index + 1]}1` : map.value.replace(number, number + 1)
					}

				} else {new_element.value = "NM1"}
			} else {new_element.setAttribute("onblur", "sendId('beatmaps', this.value)")}

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
	let to_delete = [...parent.getElementsByClassName("insert")] // Transforms HTMLCollection to Array for forEach
	to_delete.forEach((e) => parent.removeChild(e))

	let elements = parent.getElementsByClassName(type.toLowerCase())
	for (let i = 0; i < elements.length; i++) {
		let button_insert = document.createElement("button")
		button_insert.setAttribute("type", "button")
		button_insert.setAttribute("class", "insert")
		button_insert.setAttribute("onclick", `add${type}(1, ${i+1})`)

		elements[i+1] ? parent.insertBefore(button_insert, elements[i+1]) : parent.appendChild(button_insert)
	}
}

function initForm() {
	addMatch(1)
	addMap(10)
}

// Send match IDs in form before form submission for lesser wait time

function sendId(type, id) {
	if (!id || id.length < 2) return
	if (isNaN(id)) return

	let xhr = new XMLHttpRequest()
	xhr.open("POST", `/andmeid/${type}`)

	xhr.setRequestHeader("Accept", "application/json")
	xhr.setRequestHeader("Content-Type", "application/json")

	// let's not spam the console with html while error handling stuff isn't 100% figured out
	// xhr.onreadystatechange = () => {
	// 	if (xhr.readyState == 4) {
	// 		console.log(xhr.responseText) 
	// 	}
	// }

	xhr.send(`{"id": ${id}}`)
}
