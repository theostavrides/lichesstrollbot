const dotenv = require('dotenv'); dotenv.config();
const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const lichess = require('./lib/chess/lichess')(process.env.LICHESS_TOKEN)
const db = require('./db');
const { PERSONAL_NUMBER } = process.env;

const twilio = {
	sendMessage: (to, msg) => {
		return client.messages.create({
			body: msg,
			from: process.env.TWILIO_NUMBER,
			to
		})
	}
};

const moveFrontToBack = arr => {
	const copy = [...arr];
	const front = copy.shift();
	const newArray = [...copy, front];
	return newArray;
};

const lichessRequestHandler = async ({ tasks, throttle }) => {
	const taskHandler = queue => {
		const task = queue[0];
		task()
			.then(data => { 
				const nextActions = moveFrontToBack(queue);
				next(nextActions, throttle);
			})
			.catch(err => { 
				console.error(err);
				console.log('Trying again in 61 seconds');
				next(queue, 61000);
			})
	}
	const next = (queue, ms) => setTimeout(() => taskHandler(queue), ms);
	next(tasks, throttle);
};

const handleNewGameDetected = (user, game, phoneNumber) => {
	console.log(`new game detected for ${user}`)
	const victor = lichess.getVictor(game);
	const lost = victor !== user;
	const message = lost ? 'lost' : 'won';
	twilio.sendMessage(phoneNumber, `${user} has ${message} a new game.`);
	db.registerUsersLastGameId(user, game);
};

const handleNoNewGameDetected = user => {
	console.log(`No new game detected for ${user}`);
};

const sendMessageOnNewGame = (user, phoneNumber) => {
	return async () => {
		const savedGameId = await db.getUsersLastGameId(user);
		if (savedGameId) {
			const game = await lichess.getLastGameOfUser(user, { parse: true });
			const lastLichessGameId = lichess.getId(game);
			lastLichessGameId !== savedGameId ?
				handleNewGameDetected(user, game, phoneNumber) :
				handleNoNewGameDetected(user);
		} else {
			db.registerUsersLastGameId(user, game);
		}
	}
}; 

lichessRequestHandler({ 
	throttle: 5000,
	tasks: [
		sendMessageOnNewGame('dandyfap', PERSONAL_NUMBER),
		sendMessageOnNewGame('zvemoxes', PERSONAL_NUMBER),
		sendMessageOnNewGame('unclevarda', PERSONAL_NUMBER)
	]
});

