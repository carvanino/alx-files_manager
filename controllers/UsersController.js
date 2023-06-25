import dbClient from '../utils/db';

const crypto = require('crypto');

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
}
module.exports = UsersController;
// export default UsersController;
