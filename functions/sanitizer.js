module.exports = function sanitize(obj, src) {
	var rtn

	if (src == "id") return number(rtn, obj)
	if (src == "string") return string(rtn, obj)

	if (src == "response") {
		rtn = {"statusText": "", "status": 0}
		let s_statusText = string(rtn, obj.statusText)
		if (!s_statusText.pass) {return s_statusText} else {rtn.statusText = s_statusText.obj}
		let n_status = number(rtn, obj.status)
		if (!n_status.pass) {return n_status} else {rtn.status = n_status.obj}
		return {pass: true, obj: rtn, details: "response"}
	}
	
	if (src == "form") {
		console.log("idk")
		return {pass: true, obj: rtn, details: "form"}
	}

	if (src == "filename") {return filename(rtn, obj)}
}

function number(rtn, n_obj) {
	if (isNaN(n_obj)) {return {pass: false, obj: n_obj, details: "Not a number"}} else {rtn = Math.round(Number(n_obj))}
	if (rtn < 0) {return {pass: false, obj: n_obj, details: "Number too small"}} else if (rtn > 2147483646) {return {pass: false, obj: n_obj, details: "Number too big"}}
	return {pass: true, obj: rtn, details: "number"}
}

function string(rtn, s_obj) {
	try {rtn = String(s_obj)} catch {return {pass: false, obj: s_obj, details: "Invalid-looking string"}}
	rtn = rtn.replaceAll("{", "")
	rtn = rtn.replaceAll("}", "")
	rtn = rtn.replaceAll("&#", "")
	if (!rtn.length) {return {pass: false, obj: s_obj, details: "String length 0"}}
	return {pass: true, obj: rtn, details: "string"}
}

function filename(rtn, f_obj) {
	rtn = string(rtn, f_obj)
	if (!rtn.pass) {return rtn}
	rtn = rtn.obj.replaceAll("../", "")
	rtn = rtn.replaceAll("./", "")
	if (!rtn.length) {return {pass: false, obj: f_obj, details: "Filename length 0"}}
	return {pass: true, obj: rtn, details: "filename"}
}
