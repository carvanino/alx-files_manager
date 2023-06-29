import redisClient from '../utils/redis';
import dbClient from '../utils/db';

const AppController = {
  async getStatus(req, res) {
    const redis = redisClient.isAlive();
    const db = await dbClient.isAlive();
    res.status(200).json({ redis: redis, db: db });
  },

  async getStats(req, res) {
    const nbUsers = await dbClient.nbUsers();
    const nbFiles = await dbClient.nbFiles();

    res.status(200).json({ users: nbUsers, files: nbFiles });
  }
};

module.exports = AppController;