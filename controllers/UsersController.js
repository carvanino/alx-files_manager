const dbClient = require('../utils/db');
const sha1 = require('sha1');
const redisClient = require('../utils/redis');
const { ObjectId } = require('mongodb');


class  UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    const userExists = await dbClient.db.collection('users').findOne({ email });

    if (userExists) {
      return res.status(400).json({ error: 'Already exists' });
    }

    const newUser = {
      email,
      password: sha1(password)
    };

    const createdUser = await dbClient.db.collection('users').insertOne(newUser);

    res.status(201).json({ email: createdUser.ops[0].email, id: createdUser.insertedId });
  }

  static async getMe(req, res) {
    const token = req.headers['x-token'];

    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const userId = await redisClient.get(`auth_${token}`);
    // const userId =  await userIdPromise;
    // console.log(userId)
    
    const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(userId) });
    
    
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    res.status(200).json({ email: user.email, id: user._id });
  }
}

module.exports = UsersController;
