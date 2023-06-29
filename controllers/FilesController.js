import fs from 'fs';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';
import { v4 as uuidv4 } from 'uuid';

const { ObjectId } = require('mongodb');

class FilesController {
  static async getUser(req) {
    const token = req.headers['x-token'];
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);

    if (userId) {
      const user = await dbClient.db
        .collection('users')
        .findOne({ _id: ObjectId(userId) });

      if (!user) return null;
      return user;
    }
    return null;
  }

  static async postUpload(req, res) {
    let encodedData;
    const acceptedType = ['folder', 'file', 'image'];
    const { name, type, data } = req.body;
    let parentId = req.body.parentId || 0;
    const isPublic = req.body.isPublic || false;

    const user = await FilesController.getUser(req);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (type === 'file' || type === 'image') {
      encodedData = Buffer.from(data, 'base64');
    }

    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }

    if (!type || !acceptedType.includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }

    if (!data && type !== 'folder') {
      return res.status(400).json({ error: 'Missing data' });
    }

    const files = await dbClient.db.collection('files');

    if (parentId) {
      parentId = new ObjectId(parentId);

      const file = await files.findOne({ _id: parentId, userId: user._id });

      if (!file) {
        return res.status(400).json({ error: 'Parent not found' });
      }

      if (file.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }

    if (type === 'folder') {
      const newFile = {
        userId: user._id,
        name,
        type,
        isPublic,
        parentId,
      };

      await files.insertOne(newFile);

      const newFileObj = { ...newFile };
      delete newFileObj._id;

      return res.status(201).json({
        id: newFile._id,
        ...newFileObj,
      });
    }
    const filePath = process.env.FOLDER_PATH || '/tmp/files_manager';
    const filename = `${filePath}/${uuidv4()}`;

    if (!fs.existsSync(filePath)) {
      fs.mkdir(filePath, (err) => {
        if (err) console.log(err);
      });
    }
    fs.writeFile(filename, encodedData, 'utf-8', (err) => {
      if (err) console.log(err);
    });

    const newFile = {
      userId: user._id,
      name,
      type,
      isPublic,
      parentId,
      localPath: filename,
    };

    await files.insertOne(newFile);

    const newFileObj = { ...newFile };
    delete newFileObj._id;
    delete newFileObj.localPath;

    res.status(201).json({
      id: newFile._id,
      ...newFileObj,
    });
  }
  static async getShow(req, res) {
    const user = await FilesController.getUser(req);
    if (!user) {
      res.status(401).json({error: "Unauthorized"});
    }
    const fileId = req.params.id;
    const files = await dbClient.db.collection('files');
    const file = await files.findOne({ _id: ObjectId(fileId), userId: ObjectId(user.id)});

    if (!file) {
      res.status(404).json({ error: 'Not found'});
    }

    res.json(file);
  }

  static async getIndex(req, res) {
    const user = await FilesController.getUser(req);
    console.log(user);
    if (!user) {
      res.status(401).json({error: "Unauthorized"});
    }

    const parentId = req.params.id || 0;
    const page = req.params.page || 0;

    const files = await dbClient.db.collection('files');

    const pipeline = [
      { $match: { userId: ObjectId(user.id), parentId: ObjectId(parentId) }},
      { $skip: page * 20 },
      { $limit: 20 },
    ]
    const fileList = await files.aggregate(pipeline).toArray();

    res.json(fileList);
  }
}

module.exports = FilesController;