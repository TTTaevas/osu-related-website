module.exports = function existenceCheck(form, arr) {
	let good = true
	let items = Object.keys(form)

	arr.forEach((a) => {if (items.indexOf(a) == -1) {good = false}})
	return good
}
