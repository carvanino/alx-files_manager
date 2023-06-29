const uuid = require('uuid');
const dbClient = require('../utils/db');
const { default: redisClient } = require('../utils/redis');

class AuthController {
  static async getConnect(req, res) {
    const encryptedCredentials = req.headers.authorization.split(' ')[1];
    const userCredentials = Buffer.from(encryptedCredentials, 'base64').toString('utf-8');
    const userEmail = userCredentials.split(':')[0];
    // const userPassword = userCredentials.split(':')[1];

    const user = await dbClient.db.collection('users').findOne({ email: userEmail });
    if (!user) {
      return res.send({ error: 'Unauthorized' }).status(401);
    }

    const token = uuid.v4();
    const key = `auth_${token}`;

    await redisClient.set(key, user._id.toString(), 24 * 3600);
    return res.send({ token }).status(200);
  }

  static async getDisconnect(req, res) {
    const token = req.headers['x-token'];
    const key = `auth_${token}`;

    const userId = await redisClient.get(key);
    if (!userId) {
      return res.send({ error: 'Unauthorized' }).status(401);
    }

    redisClient.del(key);
    return res.status(204);
  }
}

module.exports = AuthController;
