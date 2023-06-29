const { v4 } = require('uuid');
const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');
const sha1 = require('sha1');

class AuthController {
  static async getConnect(req, res) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const credentials = authHeader.slice('Basic '.length);
    const decode = Buffer.from(credentials, 'base64').toString('utf-8');
    const [email, password] = decode.split(':');

    const user = await dbClient.db.collection('users').findOne({ email });

    if (!user) {
      res.status(400).json({ error: 'unauthorized' });
      return;
    }
    if (user.password !== sha1(password)) {
      res.status(400).json({ error: 'unauthorized' });
      return;
    }
    const token = v4();

    await redisClient.set(`auth_${token}`, user._id.toString(), 24 * 60 * 60);

    res.status(200).json({ "token": token });
    return;
  }

  static async getDisconnect(req, res) {
    const token = req.headers['x-token'];

    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Delete the token from Redis
    try {
      // Delete the token from Redis
      const result = await redisClient.del(`auth_${token}`);

      if (result === 1) {
        res.sendStatus(204);
      } else {
        res.status(500).json({ error: 'Failed to delete token' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }

    res.status(204).send();
  }
}

module.exports = AuthController;