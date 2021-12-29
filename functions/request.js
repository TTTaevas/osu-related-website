module.exports = async function request(main, header_part, data) {
	const axios = require("axios")

	// FOR SOME REASON, WHERE DOCUMENTATION INDICATES `body`, WE NEED TO REPLACE WITH `data`

	const resp = await axios({
		method: main.method,
		baseURL: `https://osu.ppy.sh/${main.base_url_part}/`,
		url: `/${main.url}`,
		headers: {
			"Accept": "application/json",
			"Content-Type": "application/json",
			...header_part
		},
		data: data
	})
	.catch((error) => {
		if (error.response) {
     		// Request made and server responded
    		console.log(error.response.statusText, error.response.status, main)
    	} else if (error.request) {
    		// The request was made but no response was received
    		console.log(error.request)
    	} else {
    		// Something happened in setting up the request that triggered an error
    		console.log("Some axios error happened", error.message)
    	}
	})
	
	if (resp) {
		console.log(resp.statusText, resp.status, main)
		return resp.data
	} else {
		return false
	}
	
}
