import dbClient from '../utils/db';
import redisClient from '../utils/redis';
// import uuid from 'uuid';
const uuid = require('uuid');

const fs = require('fs');
const { ObjectId } = require('mongodb');

class FilesController {
  static async postUpload(req, res) {
    // retreive a user based on a token
    let encodedData;
    const token = req.headers['x-token'];
    const key = `auth_${token}`;
    const userId = new ObjectId(await redisClient.get(key));
    const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(userId) });

    if (!user) {
      return res.send({ error: 'Unauthorized' }).status(401);
    }

    // Creating a file

    const { name } = req.body;
    const { type } = req.body;
    // const parentId = req.body.parentId || '0';
    let parentId = req.body.parentId ? req.body.parentId : 0;
    const isPublic = req.body.isPublic ? req.body.isPublic : false;
    const { data } = req.body;
    console.log('HEre', data);

    if (type === 'file' || type === 'image') {
      encodedData = Buffer.from(data, 'base64');
    }

    if (!name) {
      return res.send({ error: 'Missing name' }).status(400);
    }

    if (!type) {
      return res.send({ error: 'Missing type' }).status(400);
    }

    if (!data && type !== 'folder') {
      return res.send({ error: 'Missing data' }).status(400);
    }

    if (parentId) {
      parentId = new ObjectId(parentId);
      const files = await dbClient.db.collection('files').findOne({ _id: parentId });
      console.log(files.type);
      if (!files) {
        return res.send({ error: 'Parent not found' }).status(400);
      }
      if (files.type !== 'folder') {
        return res.send({ error: 'Parent is not a folder' }).status(400);
      }
    }
    if (type === 'folder') {
      const newFile = {
        userId,
        name,
        type,
        isPublic,
        parentId,
      };
      await dbClient.db.collection('files').insertOne(newFile);
      const id = newFile._id;
      delete newFile._id;

      return res.send({
        id,
        ...newFile,
      }).status(201);
    }

    // if type is not a folder
    const FOLDER_PATH = process.env.FOLDER_PATH ? process.env.FOLDER_PATH : '/tmp/files_manager';
    const localPath = `${FOLDER_PATH}/${uuid.v4()};`;
    if (!fs.existsSync(FOLDER_PATH)) {
      fs.mkdir(FOLDER_PATH, (err) => {
        if (err) {
          console.log(err);
        }
      });
    }

    fs.writeFile(localPath, encodedData, 'utf-8', (err) => {
      if (err) {
        console.log(err);
      }
    });

    const newFile = {
      userId,
      name,
      type,
      isPublic,
      parentId,
      localPath,
    };

    await dbClient.db.collection('files').insertOne(newFile);

    const id = newFile._id;
    delete newFile._id;
    delete newFile.localPath;

    return res.send({
      id,
      ...newFile,
    }).status(201);
  }

  static async getShow(req, res) {
    let { id } = req.params;
    // console.log(id);

    // get the user based on a token
    const token = req.headers['x-token'];
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(userId) });

    if (!user) {
      return res.send({ error: 'Unauthorized' }).status(401);
    }

    const file = await dbClient.db.collection('files').findOne({ userId: new ObjectId(userId), _id: new ObjectId(id) });
    // console.log(file);
    if (!file) {
      return res.send({ error: 'Not found' }).status(404);
    }
    id = file._id;
    delete file._id;
    delete file.localPath;

    return res.send({
      id,
      ...file,
    });
  }

  static async getIndex(req, res) {
    const token = req.headers['x-token'];
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(userId) });

    if (!user) {
      return res.send({ error: 'Unauthorized' }).status(401);
    }

    // get query parameters
    const parentId = req.query.parentId ? new ObjectId(req.query.parentId) : 0;
    console.log(parentId);

    const { page } = req.query;
    const pageSize = 20;
    const endIndex = pageSize * page;
    // const startIndex = endIndex - pageSize;

    const pipeline = [
      { $match: { parentId } },
      { $skip: endIndex },
      { $limit: pageSize },
    ];
    const pagedFiles = await dbClient.db.collection('files').aggregate(pipeline).toArray();

    for (const file of pagedFiles) {
      file.id = file._id;
      delete file._id;
      delete file.localPath;
    }
    return res.send(pagedFiles);
  }

  static async putPublish(req, res) {
    const token = req.headers['x-token'];
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(userId) });
    const { id } = req.params;

    if (!user) {
      return res.send({ error: 'Unauthorized' }).status(401);
    }
    const file = await dbClient.db.collection('files').findOne({ _id: new ObjectId(id), userId: new ObjectId(userId) });
    console.log(file);
    if (!file) {
      return res.send({ error: 'Not found' }).status(404);
    }
    file.isPublic = true;
    return res.send(file).status(200);
  }

  static async putUnpublish(req, res) {
    const token = req.headers['x-token'];
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(userId) });
    let { id } = req.params;

    if (!user) {
      return res.send({ error: 'Unauthorized' }).status(401);
    }
    const file = await dbClient.db.collection('files').findOne({ _id: new ObjectId(id), userId: new ObjectId(userId) });
    if (!file) {
      return res.send({ error: 'Not found' }).status(404);
    }
    file.isPublic = false;
    id = file._id;
    delete file._id;
    delete file.localPath;

    return res.send({
      id,
      ...file,
    }).status(200);
  }
}

module.exports = FilesController;
