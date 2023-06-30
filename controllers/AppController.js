import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AppController {
  static getStatus(req, res) {
    const dbStatus = {
      redis: redisClient.isAlive(),
      db: dbClient.isAlive(),
    };
    return res.status(200).send(dbStatus);
  }
  
  static async getStats(req, res) {
    const expectedRes = {
      users: await dbClient.nbUsers(),
      files: await dbClient.nbFiles(),
    };
    return res.send(expectedRes).status(200);
  }
}

module.exports = AppController;
