const existenceCheck = require("../../functions/existence-check.js")

const getTournaments = require("./shared/getTournaments")
const insertMatches = require("./shared/insertMatches")

exports.main = async (req, res) => {
	let tournaments = await getTournaments(req.history)
	res.render("history/referee", {user: req.auth.user, roles: req.roles, tournaments})
}

exports.add = async (req, res) => {
	let form = req.body
	let files = req.files

	let file_name = false
	if (!existenceCheck(form, ["add_name"])) {return res.status(400).send("Missing tournament name")}

	if (req.history.tournaments.array.find((tournament) => {return tournament.name == form.add_name})) {
		return res.status(302).send("This tournament already exists!")
	}

	if (files && files.add_banner) {
		file_name = files.add_banner.name
		let banner = files.add_banner
		banner.mv(`${process.cwd()}/public/banners/${file_name}`, function(e) {if (e) {console.log("Could not treat banner", e)}})
	}

	var mp_ids
	if (!form.add_mp_ids || !form.add_mp_ids.length) {
		mp_ids = []
	} else {
		mp_ids = form.add_mp_ids.replace(/ /g, "").split(",").filter((id) => {return !isNaN(id) && id.length})
		for (let i = 0; i < mp_ids.length; i++) {mp_ids[i] = Number(mp_ids[i])}
	}

	try {
		let tournament = {
			name: form.add_name,
			forum: form.add_forum,
			date: new Date(form.add_date),
			matches: mp_ids,
			banner: file_name
		}

		let insertion = await req.history.tournaments.collection.insertOne(tournament)
		insertion.insertedId ? console.log(`${tournament.name} has been added`) : console.log(`${tournament.name} could not be added`)
		await res.status(201).send(`${tournament.name} added successfully`)

		if (mp_ids.length) {
			console.log("(REFEREE) Now looking for match data due to", mp_ids)
			req.history.tournaments.array = await req.history.tournaments.collection.find().toArray()
			insertMatches(req.history)
		}
	} catch(e) {
		console.log("Could not add tournament", e)
		await res.status(500).send("Error, contact Taevas about it")
	}
}

exports.addMatches = async (req, res) => {
	let form = req.body
	if (!existenceCheck(form, ["mp_ids", "tournament_name"])) {return res.status(400).send("Missing match ID or tournament name")}

	let mp_ids = form.mp_ids.replace(/ /g, "").split(",").filter((id) => {return !isNaN(id) && id.length})
	if (!mp_ids.length) {return res.status(302).send("No valid match ID in input")}

	let tournament = req.history.tournaments.array.find((tournament) => {return tournament.name == form.tournament_name})
	if (!tournament) {return res.status(302).send("This tournament does not exist!")}

	mp_ids = mp_ids.filter((id) => {return tournament.matches.indexOf(id) == -1})
	if (!mp_ids.length) {return res.status(302).send("Matches in input are already there")}

	for (let i = 0; i < mp_ids.length; i++) {mp_ids[i] = Number(mp_ids[i])}
	let updated = {matches: tournament.matches.concat(mp_ids)}
	await req.history.tournaments.collection.updateOne({name: form.tournament_name}, {$set: updated})

	res.status(201).send(`Finished adding ${mp_ids.length} match(es) for ${form.tournament_name}\nWill now fetch multiplayer information`)
	req.history.tournaments.array = await req.history.tournaments.collection.find().toArray()
	insertMatches(req.history)
}

exports.remove = async (req, res) => {
	let form = req.body
	if (!existenceCheck(form, ["remove_name"])) {return res.status(400).send("Missing tournament name")}

	let tournament = req.history.tournaments.array.find((tournament) => {return tournament.name == form.remove_name})
	if (!tournament) {return res.status(302).send("This tournament does not exist!")}
	let matches = tournament.matches

	try {
		let deletion = await req.history.tournaments.collection.deleteOne({name: form.remove_name})
		deletion.deletedCount ? console.log(`${form.remove_name} has been removed`) : console.log(`${form.remove_name} could not be removed`)
		for (let i = 0; i < matches.length; i++) {
			await req.history.matches.collection.deleteOne({id: matches[i]})
		}
		await res.status(201).send(`${form.remove_name} removed successfully`)
	} catch(e) {
		console.log("Could not remove tournament", e)
		await res.status(201).send("Error, contact Taevas about it")
	}
}

exports.import = async (req, res) => { // lol nice name
	return await res.status(500).send("Not quite sure if it works or not, for now I'm making this unusable")
	
	let files = req.files
	if (!files || !files.import_json) {return res.status(302).send("No file")}
	let temp_file = files.import_json

	let file_name = __dirname + `/temp_files/${temp_file.md5}.json`
	await temp_file.mv(file_name)

	var json_file

	try {
		let raw_json_file = await fs.readFileSync(file_name)
		const isoDatePattern = new RegExp(/\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/)
		json_file = JSON.parse(raw_json_file, (key, value) => {
			// This code converts Strings like "2021-02-12T23:00:00.000Z" (isostrings) to Date objects
			if (typeof value === "string" && value.match(isoDatePattern)) {
				return new Date(value)
			}
			return value
		})
	} catch(e) {
		console.log("Could not read json", e)
		if (fs.existsSync(file_name)) {await fs.unlinkSync(file_name)}
		return await res.status(500).send("Error, couldn't read json, contact Taevas about it")
	}

	if (fs.existsSync(file_name)) {await fs.unlinkSync(file_name)}
	if (!json_file || !json_file.tournaments) {
		console.log("json_file is empty", e)
		return await res.status(500).send("Error, json seems empty, contact Taevas about it if needed")
	}

	let tournaments = json_file.tournaments
	var counter_good = 0
	var counter_bad = 0

	for (let i = 0; i < tournaments.length; i++) {
		try {
			let tournament = {
				name: tournaments[i].name,
				forum: tournaments[i].forum,
				date: tournaments[i].date[0],
				matches: tournaments[i].mp_ids,
				banner: false
			}

			await req.history.tournaments.collection.insertOne(tournament)
			console.log(`${tournaments[i].name} added successfully`)
			counter_good++
		} catch(e) {
			console.log(`${tournaments[i].name} could not be added`, e.message)
			counter_bad++
		}
	}

	res.status(201).send(`Finished, added ${counter_good}, failed ${counter_bad}\nWill now fetch multiplayer information`)
	req.history.tournaments.array = await req.history.tournaments.collection.find().toArray()
	insertMatches(req.history)
}
