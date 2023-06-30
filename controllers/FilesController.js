import dbClient from '../utils/db';
import redisClient from '../utils/redis';
// import uuid from 'uuid';
const uuid = require('uuid');
const mime = require('mime-types');

const Bull = require('bull');

const fileQueue = new Bull('fileQueue');

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
    // console.log('HEre', data);

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
    const localPath = `${FOLDER_PATH}/${uuid.v4()}`;
    if (!fs.existsSync(FOLDER_PATH)) {
      fs.mkdir(FOLDER_PATH, (err) => {
        if (err) {
          console.log(err);
        }
      });
    }

    fs.writeFileSync(localPath, encodedData, 'utf-8', (err) => {
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
    if (type === 'image') {
      fileQueue.add({
        userId: newFile.userId,
        fileId: newFile._id,
      });
    }

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
    let { id } = req.params;

    if (!user) {
      return res.send({ error: 'Unauthorized' }).status(401);
    }
    const file = await dbClient.db.collection('files').findOne({ _id: new ObjectId(id), userId: new ObjectId(userId) });
    if (!file) {
      return res.send({ error: 'Not found' }).status(404);
    }
    // file.isPublic = true;
    await dbClient.db.collection('files').updateOne({ _id: ObjectId(id) }, { $set: { isPublic: true } });

    const updatedFile = await dbClient.db.collection('files').findOne({ _id: ObjectId(id) });
    id = updatedFile._id;
    delete updatedFile._id;
    delete updatedFile.localPath;

    return res.send({
      id,
      ...updatedFile,
    }).status(200);
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
    // file.isPublic = false;
    await dbClient.db.collection('files').updateOne({ _id: ObjectId(id) }, { $set: { isPublic: false } });

    const updatedFile = await dbClient.db.collection('files').findOne({ _id: ObjectId(id) });
    id = updatedFile._id;
    delete updatedFile._id;
    delete updatedFile.localPath;

    return res.send({
      id,
      ...updatedFile,
    }).status(200);
  }

  static async getFile(req, res) {
    const token = req.headers['x-token'];
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    const { size } = req.query;
    console.log('user id', userId);

    const { id } = req.params;

    const file = await dbClient.db.collection('files').findOne({ _id: new ObjectId(id) });
    if (!file) {
      return res.send({ error: 'Not found' }).status(404);
    }
    // console.log(' File is public?', file.isPublic);
    if ((file.isPublic === false) && (!userId || file.userId.toString() !== userId.toString())) {
      return res.send({ error: 'Not found' }).status(404);
    }

    if (file.type === 'folder') {
      return res.send({ error: 'A folder doesn\'t have content' }).status(400);
    }
    // const FOLDER_PATH = process.env.FOLDER_PATH ? process.env.FOLDER_PATH : '/tmp/files_manager';
    // const localPath = `${FOLDER_PATH}/${uuid.v4()}`;

    const mimeType = mime.lookup(file.name);
    let { localPath } = file;

    if (size) {
      localPath = `${file.localPath}_${size}`;
    }

    if (!fs.existsSync(localPath)) {
      return res.send({ error: 'Not found' }).status(404);
    }

    // if (file.type === 'image') {
    //   // const imagePath = `${file.localPath}_${size}`;
    //   const imagePath = '/tmp/files_manager/45e786c6-5bb8-4661-998f-e6003eff8e41;_250'
    //   console.log('The image path is', imagePath);
    //   if (!fs.existsSync(imagePath)) {
    //     return res.send({ error: 'Not found' }).status(404);
    //   }
    //   console.log(imagePath);
    //   await fs.promises.readFile(imagePath, (err, data) => {
    //     if (!err) {
    //       res.setHeader('Content-Type', mimeType);
    //       console.log('In here');
    //       return res.sendFile(imagePath);
    //     }
    //     console.log(err)
    //   });

    // }

    fs.readFile(localPath, (err, data) => {
      if (!err) {
        res.setHeader('Content-Type', mimeType);
        return res.send(data);
      }
      console.log(err);
      return res.status(500);
    });
    return res.status(200);
  }
}

module.exports = FilesController;
