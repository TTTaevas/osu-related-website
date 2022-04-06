function api(type, id) {
	if (!id) return {status: false, error: "No valid ID was provided"}
	if (isNaN(id)) return {status: false, error: "The ID provided was invalid"}

	let xhr = new XMLHttpRequest()
	xhr.open("POST", `/andmeid/${type}`)

	xhr.setRequestHeader("Accept", "application/json")
	xhr.setRequestHeader("Content-Type", "application/json")

	xhr.send(`{"id": ${id}}`)
}
