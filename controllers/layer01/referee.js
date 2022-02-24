exports.home = async (req, res) => {
	if (!req.user || !req.user.roles.referee) {return res.status(403).render("layer01/error", {status: {code: 403, reason: "Unauthorized; you shouldn't be there :3c"}})}

	let lobbies_col = req.db.collection("quals_lobbies")
	let lobbies = await lobbies_col.find().toArray()
	lobbies = lobbies.sort((a, b) => {return Number(a.schedule) - Number(b.schedule)})
	
	let lobby = false
	if (req.query.lobby) {lobby = lobbies.find((a) => {return a.id == req.query.lobby})}

	let playlist = false
	if (lobby) {
		let playlists_col = req.db.collection("playlists")
		let pools = await playlists_col.find().toArray()
		playlist = pools.find((p) => {return p.name.toLowerCase() == "qualifiers playlist"})
	}

	res.status(200).render("layer01/referee", {user: req.user, lobby: lobby, lobbies: lobbies, playlist: playlist})
}
