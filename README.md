# taevas.xyz

[taevas.xyz](https://taevas.xyz) is my personal website meant for multiple osu!-related projects

## HOW TO TEST

Start by cloning the repository and doing the `npm i` command to install the node modules

Create a `.env` file, and set `PRODUCTION` in it to `false`

* Set `API_OSU_V1` (needed to fetch Star Rating of osu! beatmaps with mods) to [your osu!api v1 key](https://osu.ppy.sh/p/api)
* Set `API_OSU_V2` (needed for anything osu!api v2) to [your OAuth Application's Client Secret](https://osu.ppy.sh/home/account/edit) (create new app if not done yet)
* Set `SESSION_SECRET` to [some random string people won't guess](https://stackoverflow.com/questions/5343131/what-is-the-sessions-secret-option)

After having created a new project in [MongoDB](https://cloud.mongodb.com), create a new Database User in its Database Access section, remember the user's password

* Set `DB_AUTH` to the connection string you find in the Database Deployments page after clicking on "Connect" -> "Connect your application" -> "Node.js 4.0 or later", but replace `<password>` with the password for the Database User you've created, and `myFirstDatabase` with the name of the database used for authentication
* For `DB_HISTORY`, `DB_LAYER01`, `DB_ANDMEID`, and `DB_TURNIIR`, create a new database, then set them to `DB_AUTH`'s value, except with the appropriate database name 

Finally, just do `node db-clients.js` or `npm start` to run the website and go to `localhost:3000` to check it out

## LICENSE

You are free to do whatever the fuck you wanna do with the code in this repository, though feel free to let me know what you do with it; I still am curious

Read the LICENSE file for information on this repository's license
