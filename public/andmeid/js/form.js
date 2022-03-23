function addMatch(n) {
	const div_matches = document.getElementById("matches")
	for (let i = 0; i < n; i++) {
		let new_match = document.createElement("input")
		new_match.setAttribute("type", "text")
		new_match.setAttribute("class", "match")
		new_match.setAttribute("name", "matches")
		div_matches.appendChild(new_match)
	}
}

function addMap(n) {
	const div_maps = document.getElementById("mappool")
	const existing_maps = document.getElementsByClassName("map")

	for (let i = 0; i < n; i++) { // fun fact, `existing_maps.length` changes with each iteration
		let new_map = document.createElement("div")
		new_map.setAttribute("class", "map")

		let elements = ["mod_id", "map_id"]
		elements.forEach((a) => {
			let new_element = document.createElement("input")
			new_element.setAttribute("type", "text")
			new_element.setAttribute("class", a)
			new_element.setAttribute("name", `maps[${existing_maps.length}][${a}]`)

			if (a == "mod_id") {
				let map = existing_maps[existing_maps.length - 1]
				if (existing_maps[existing_maps.length - 1]) {
					map = map.getElementsByClassName("mod_id")[0]
					let mod = map.value.replace(/[0-9]/g, '')
					let number = Number(map.value.replace(/[^0-9]/g, ''))

					if (mod == "NM") {
						new_element.value = number == 4 ? "HD1" : map.value.replace(number, number + 1)
					} else {
						let mods = ["HD", "HR", "DT", "FM", "TB"]
						let index = mods.indexOf(mod)
						new_element.value = number == 2 ? index == mods.length - 1 ? map.value.replace(number, number + 1) : `${mods[index + 1]}1` : map.value.replace(number, number + 1)
					}

				} else {new_element.value = "NM1"}
			}

			new_map.appendChild(new_element)
		})

		div_maps.appendChild(new_map)
	}
}

function initForm() {
	addMatch(1)
	addMap(10)
}
