exports.home = async (req, res) => {
	let lobbies_col = req.layer01.db.collection("quals_lobbies")
	let lobbies = await lobbies_col.find().toArray()
	lobbies = lobbies.sort((a, b) => {return Number(a.schedule) - Number(b.schedule)})
	
	let lobby = false
	if (req.query.lobby) {lobby = lobbies.find((a) => {return a.id == req.query.lobby})}

	let playlist = false
	if (lobby) {
		let playlists_col = req.layer01.db.collection("playlists")
		let pools = await playlists_col.find().toArray()
		playlist = pools.find((p) => {return p.name.toLowerCase() == "qualifiers playlist"})
	}

	res.status(200).render("layer01/referee", {user: req.auth.user, lobby: lobby, lobbies: lobbies, playlist: playlist})
}
