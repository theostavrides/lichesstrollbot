const redis = require("redis");
const client = redis.createClient();
const { promisify } = require("util");
const lichess = require('./lichess')(process.env.LICHESS_TOKEN)

const setAsync = promisify(client.set).bind(client);
const getAsync = promisify(client.get).bind(client);
const delAsync = promisify(client.del).bind(client);

module.exports = {
	getUsersLastGameId: async user => {
		return getAsync(user)
	},

	registerUsersLastGameId: async (user, game) => {
		const gameid = lichess.getId(game)
		return setAsync(user, gameid)
	},
}
