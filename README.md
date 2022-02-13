# taevas.xyz

[taevas.xyz](https://taevas.xyz) is my personal website meant for multiple osu!-related stuff, such as my own tournament history (succeeding to my static website [TTTaevas.github.io](https://tttaevas.github.io)) or my tournaments, such as LAYER01

## TOURNAMENT HISTORY: DIFFERENCES WITH TTTaevas.github.io

* The website is not hosted by GitHub
* I (Taevas) actually own the domain the website is hosted at
* There is a login system (currently through LAYER01)
* Depending of who you login as, you have access to more features
* These features include changing the tournaments featured on the website in various ways
* Consequently, making commits to the repository to update the tournaments is no longer needed

## HOW TO TEST

Start by cloning the repository and doing the `npm i` command to install the node modules

Create a `.env` file, and set `PRODUCTION` in it to `false`

* Set `OSU_V1_KEY` (needed to fetch Star Rating of osu! beatmaps with mods) to [your osu!api v1 key](https://osu.ppy.sh/p/api)
* Set `OSU_CLIENT_SECRET` (needed for anything osu!api v2) to [your OAuth Application's Client Secret](https://osu.ppy.sh/home/account/edit) (create new app if not done yet)
* Set `SESSION_SECRET` to [some random string people won't guess](https://stackoverflow.com/questions/5343131/what-is-the-sessions-secret-option)

After having created a new project in [MongoDB](https://cloud.mongodb.com), create a new Database User in its Database Access section, remember the user's password

* Set `CONNECTIONSTRING` to what you find in the Database Deployments page after clicking on "Connect" -> "Connect your application" -> "Node.js 4.0 or later", but replace `<password>` with the password for the Database User you've created, and `myFirstDatabase` with the name of the database (currently) used for authentication and LAYER01
* Set `REF_CONNECTIONSTRING` to `CONNECTIONSTRING`'s value but replace the database name with the name of the database used for the history/referee part of the website

Finally, just do `node database.js` to run the website and go to `localhost:3000` to check it out

## LICENSE

You are free to do whatever the fuck you wanna do with the code in this repository, though feel free to let me know what you do with it; I still am curious

Read the LICENSE file for information on this repository's license
