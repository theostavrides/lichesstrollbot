const axios = require('axios');
const pgnParser = require('pgn-parser');

module.exports = function lichess(lichessToken) {
	return {
		defaults: { clocks: true },

		addDefaultOptions: function(options){
			return { ...this.defaults, ...options };
		},

		parsePGN: function(data){ 
			return new Promise(resolve => pgnParser((err, parser) => resolve(parser.parse(data))));;
		},

		getVictor: function(game) {
			const { White, Black, Result } = game.headers;
		    if (Result[0] === '1') return White;
		    if (Result[2] === '1') return Black;
		    return null;
		},

		vs: async function(user1, user2, options){
			const optionsWithDefaults = this.addDefaultOptions(options);

			const res = await axios.get(`/api/games/user/${user1}`, {
			  baseURL: 'https://lichess.org/',
			  headers: { 'Authorization': 'Bearer ' + lichessToken },
			  params: {	vs: user2, ...optionsWithDefaults }
			})

			if (status === 200) {
				return res.data
			} else {
				return Promise.reject(Error(status));
			}
		},

		getUserGames: async function(user, options) {
			const optionsWithDefaults = this.addDefaultOptions(options);

			const res = await axios.get(`/api/games/user/${user}`, {
			  baseURL: 'https://lichess.org/',
			  headers: { 'Authorization': 'Bearer ' + lichessToken },
			  params: {	...optionsWithDefaults }
			})

			const { data, status } = res;

			if (status === 200) {
				return options.parse ? this.parsePGN(data) : data; 
			} else {
				return Promise.reject(Error(status));
			}
		},

		getUserActivity: async function(user, options) {
			const optionsWithDefaults = this.addDefaultOptions(options);

			const res = await axios.get(`/api/user/${user}/activity`, {
			  baseURL: 'https://lichess.org/',
			  headers: { 'Authorization': 'Bearer ' + lichessToken },
			  params: {	...optionsWithDefaults }
			})

			if (status === 200) {
				return res.data
			} else {
				return Promise.reject(Error(status));
			}
		},
	}
}