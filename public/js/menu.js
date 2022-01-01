function stay(btn) {
	const drp_ctn = btn.nextElementSibling
	drp_ctn.style.display = window.getComputedStyle(drp_ctn).display == "none" ? "block" : "none"
}
