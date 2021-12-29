const fs = require("fs")
const path = require("path")
const uploadPath = path.dirname(__dirname) + "/public/banners/"

const fetchMatchData = require("./fetch-match-data.js")

async function addTournament(form, req, res) {
	if (!form || !form.add_name || !form.add_name.length) {return res.status(302).send("Missing tournament name")}
	let stuff = await refClient()
	const tournaments = await stuff.collection.find().toArray()

	if (tournaments.find((tournament) => {return tournament.name == form.add_name})) {
		return res.status(302).send("This tournament already exists!")
	}

	if (req.files && req.files.add_banner) {
		let banner = req.files.add_banner
		banner.mv(`${uploadPath}${req.files.add_banner.name}`, function(e) {if (e) {console.log("Could not treat banner", e)}})
	}

	var mp_ids
	if (!form.add_mp_ids || !form.add_mp_ids.length) {
		mp_ids = []
	} else {
		mp_ids = form.add_mp_ids.split(",").filter((id) => {return !isNaN(id)})
		for (let i = 0; i < mp_ids.length; i++) {mp_ids[i] = Number(mp_ids[i])}
	}

	try {
		let tournament = {
			name: form.add_name,
			forum: form.add_forum,
			date: new Date(form.add_date),
			matches: mp_ids,
			banner: req.files && req.files.add_banner ? req.files.add_banner.name : false
		}

		await stuff.collection.insertOne(tournament)
		await res.status(201).send(`${form.add_name} added successfully`)
	} catch(e) {
		console.log("Could not add tournament", e)
		await res.status(500).send(`Error: ${e}`)
	} finally {
		await stuff.client.close()
		if (mp_ids.length) {
			console.log("Now looking for match data due to", mp_ids)
			fetchMatchData("referee")
		}
	}
}

async function removeTournament(form, res) {
	if (!form || !form.remove_name || !form.remove_name.length) {return res.status(302).send("Missing tournament name")}
	let stuff = await refClient()
	const tournaments = await stuff.collection.find().toArray()

	let tournament = tournaments.find((tournament) => {return tournament.name == form.remove_name})
	if (!tournament) {return res.status(302).send("This tournament does not exist!")}
	let matches = tournament.matches
	let matches_collection = stuff.db.collection("matches")

	try {
		await stuff.collection.deleteOne({name: form.remove_name})
		for (let i = 0; i < matches.length; i++) {await matches_collection.deleteOne({id: matches[i]})}
		console.log(`${form.remove_name} has been removed`)
		await res.status(201).send(`${form.remove_name} removed successfully`)
	} catch(e) {
		console.log("Could not remove tournament", e)
		await res.status(201).send(`Error: ${e}`)
	} finally {
		await stuff.client.close()
	}
}

async function importTournament(req, res) {
	if (!req.files || !req.files.import_json) {return res.status(302).send("No file")}
	let temp_file = req.files.import_json
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
		return await res.status(500).send(`Error: ${e}`)
	}

	if (fs.existsSync(file_name)) {await fs.unlinkSync(file_name)}
	if (!json_file || !json_file.tournaments) {
		console.log("json_file is empty", e)
		return await res.status(500).send(`Error: ${e}`)
	}

	let stuff = await refClient()
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

			await stuff.collection.insertOne(tournament)
			console.log(`${tournaments[i].name} added successfully`)
			counter_good++
		} catch(e) {
			console.log(`${tournaments[i].name} could not be added`, e)
			counter_bad++
		}
	}

	await stuff.client.close()
	res.status(201).send(`Finished, added ${counter_good}, failed ${counter_bad}\nWill now fetch multiplayer information`)
	fetchMatchData("referee")
}

async function addMatches(form, res) {
	if (!form || !form.add_mp_ids || !form.add_mp_ids.length) {return res.status(302).send("No match ID in input")}
	if (!form.tournament_name || !form.tournament_name.length) {return res.status(302).send("Missing tournament name")}

	let mp_ids = form.add_mp_ids.split(",").filter((id) => {return !isNaN(id)})
	for (let i = 0; i < mp_ids.length; i++) {mp_ids[i] = Number(mp_ids[i])}
	if (!mp_ids.length) {return res.status(302).send("No valid match ID in input")}

	let stuff = await refClient()
	const tournaments = await stuff.collection.find().toArray()
	let tournament = tournaments.find((tournament) => {return tournament.name == form.tournament_name})
	if (!tournament) {return res.status(302).send("This tournament does not exist!")}

	mp_ids = mp_ids.filter((id) => {return tournament.matches.indexOf(id) == -1})
	if (!mp_ids.length) {return res.status(302).send("Matches in input are already there")}

	let updated = {matches: tournament.matches.concat(mp_ids)}
	await stuff.collection.updateOne({name: form.tournament_name}, {$set: updated})
	res.status(201).send(`Finished adding ${mp_ids.length} match(es) for ${form.tournament_name}\nWill now fetch multiplayer information`)
	fetchMatchData("referee")
}

module.exports = {
	addTournament,
	removeTournament,
	importTournament,
	addMatches
}

async function refClient() {
	require('dotenv').config()
	const mongodb = require("mongodb").MongoClient

	const client = new mongodb(process.env.REF_CONNECTIONSTRING)
	await client.connect()
	const db = client.db()
	const tournaments_collection = db.collection("tournaments")

	return {client: client, db: db, collection: tournaments_collection}
}
