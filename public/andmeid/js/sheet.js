function sheetIDs(type, element) {
	let ids = element.value.split(/(\n| )+/)
	.map(m => Number(m.replace(/[^\d]/g, "")))
	.filter(a => a)

	ids.forEach((m, i) => {
		setTimeout(() => api(type, m, {host: document.getElementById(`${type}_list`), size: "r"}), 100*i)
	})

	document.getElementById(type).remove()
}
