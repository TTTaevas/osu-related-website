function changeDisplay(v) {
	const add = document.getElementById("tournament_add")
	const rem = document.getElementById("tournament_remove")
	const imp = document.getElementById("tournament_import")

	if (v == "add") {
		add.style.display = "block"
		rem.style.display = "none"
		imp.style.display = "none"
	} else if (v == "rem") {
		add.style.display = "none"
		rem.style.display = "block"
		imp.style.display = "none"
	} else if (v == "imp") {
		add.style.display = "none"
		rem.style.display = "none"
		imp.style.display = "block"
	} else {
		add.style.display = "none"
		rem.style.display = "none"
		imp.style.display = "none"
	}
}
