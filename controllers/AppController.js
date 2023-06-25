
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AppController {
  static getStatus(req, res) {
    if (redisClient.isAlive() & dbClient.isAlive()) {
      res.send({ redis: 'true', db: 'true' });
      res.status(200);
    }
    res.status(400);
  }

  static async getStats(req, res) {
    const expectedRes = {
      users: await dbClient.nbUsers(),
      files: await dbClient.nbFiles()
    }
    res.send(expectedRes);
    res.status(200)
  }
}
module.exports = AppController;