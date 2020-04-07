const dotenv = require('dotenv'); dotenv.config();
const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const lichess = require('./lib/chess/lichess')(process.env.LICHESS_TOKEN)

const sendMessage = (to, msg) => {
	return client.messages.create({
		body: msg,
		from: process.env.TWILIO_NUMBER,
		to
	})
}

const moveFrontToBack = arr => {
	const copy = [...arr];
	const front = copy.shift();
	const newArray = [...copy, front];
	return newArray;
}

const lichessRequestHandler = async ({ tasks, throttle }) => {
	const taskHandler = queue => {
		const task = queue[0];
		task()
			.then(data => { 
				const nextActions = moveFrontToBack(queue)
				next(nextActions, throttle)
			})
			.catch(err => { 
				console.log(`Request failed with code ${err}, trying again in 61 seconds`)
				next(queue, 61000) 
			})
	}
	const next = (queue, ms) => setTimeout(() => taskHandler(queue), ms);
	next(tasks, throttle);
}

const logGameData = (user) => {
	return () => lichess.getUserGames(user, { max: 1, parse: true }).then(games => {
		const victor = lichess.getVictor(games[0])
		console.log(victor)
	})
} 

lichessRequestHandler({ 
	throttle: 5000,
	tasks: [
		logGameData('dandyfap'),
		logGameData('zvemoxes'),
		logGameData('unclevarda')
	]
})