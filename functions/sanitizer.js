module.exports = function sanitize(obj, src) {
	var rtn

	if (src == "id") return number(rtn, obj)
	if (src == "string") return string(rtn, obj)

	// if (src == "response") { Is it really useful? To me, that just looks useless, unless proven otherwise
	// 	rtn = {"statusText": "", "status": 0}
	// 	let s_statusText = string(rtn, obj.statusText)
	// 	if (!s_statusText.pass) {return s_statusText} else {rtn.statusText = s_statusText.obj}
	// 	let n_status = number(rtn, obj.status)
	// 	if (!n_status.pass) {return n_status} else {rtn.status = n_status.obj}
	// 	return {pass: true, obj: rtn, details: "response"}
	// }
	
	if (src == "form") {
		if (!obj || typeof obj != "object") {return {pass: false, obj: obj, details: "Not an object"}}
		rtn = {}

		for (let i = 0; i < Object.keys(obj).length; i++) {
			let key = sanitize(Object.keys(obj)[i], "string")
			if (!key.pass) {continue}
			let value = sanitize(Object.values(obj)[i], key.obj == "id" ? "id" : "string")
			if (!value.pass) {continue}
			rtn[key.obj] = value.obj

			// I kinda don't wanna allow anyone to create a big-ass form if you see what I mean
			if (i >= 16) {i = Object.keys(obj).length}
		}
	
		return {pass: true, obj: rtn, details: "form"}
	}

	if (src == "filename") {
		rtn = string(rtn, obj)
		if (!rtn.pass) {return rtn}
		rtn = rtn.obj.replace(/\//g, "")
		if (!rtn.length) {return {pass: false, obj: obj, details: "Filename length 0"}}
		return {pass: true, obj: rtn, details: "filename"}
	}

	return {pass: false, obj: rtn, details: "src invalid"}
}

function number(rtn, n_obj) {
	if (isNaN(n_obj)) {return {pass: false, obj: n_obj, details: "Not a number"}} else {rtn = Math.round(Number(n_obj))}
	// 2147483646 is (close to) a certain integer limit, though not the JS one, but it would be sus for a number to go above it
	if (rtn < 0) {return {pass: false, obj: n_obj, details: "Number too small"}} else if (rtn > 2147483646) {return {pass: false, obj: n_obj, details: "Number too big"}}
	return {pass: true, obj: rtn, details: "number"}
}

function string(rtn, s_obj) {
	try {rtn = String(s_obj)} catch {return {pass: false, obj: s_obj, details: "Invalid-looking string"}}
	rtn = rtn.replace(/{/g, "")
	rtn = rtn.replace(/}/g, "")
	rtn = rtn.replace(/</g, "")
	rtn = rtn.replace(/>/g, "")
	rtn = rtn.replace(/\?/g, "")
	rtn = rtn.replace(/&/g, "")
	rtn = rtn.replace(/%/g, "")
	if (!rtn.length) {return {pass: false, obj: s_obj, details: "String length 0"}}
	return {pass: true, obj: rtn, details: "string"}
}
