import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const crypto = require('crypto');
const { ObjectId } = require('mongodb');

class UsersController {
  static async postNew(req, res) {
    // console.log(req.body);
    const { email } = req.body;
    const { password } = req.body;

    if (!email) {
      return res.send({ error: 'Missing email' }).status(400);
    }

    if (!password) {
      return res.send({ error: 'Missing password' }).status(400);
    }
    const hashedPwd = crypto.createHash('sha1').update(password).digest('hex');

    const user = await dbClient.db.collection('users').find({ email }).toArray();
    console.log(user);
    if (user) {
      return res.send({ error: 'Already exist' }).status(400);
    }

    const newUser = {
      email,
      password: hashedPwd,
    };
    await dbClient.db.collection('users').insertOne(newUser);

    return res.send({ id: newUser._id, email: newUser.email }).status(201);
  }

  static async getMe(req, res) {
    const token = req.headers['x-token'];
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);

    const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(userId) });
    if (!user) {
      return res.send({ error: 'Unauthorized' }).status(401);
    }
    return res.send({ email: user.email, id: user._id });
  }
}
module.exports = UsersController;
// export default UsersController;
