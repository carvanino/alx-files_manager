
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

export default class AppController {
	static getStatus(req, res) {
		if (redisClient.isAlive() & dbClient.isAlive()) {
			res.send({redis: 'true', db: 'true'});
			res.status(200);
		}
		res.status(400);
	}

	static getStats(req, res) {
		expectedRes = {
			users: dbClient.nbUsers(),
			files: dbClient.nbFiles()
		}
		res.send(expectedRes);
		res.status(200)
	}
}

// module.exports = AppController;
