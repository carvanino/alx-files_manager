// const Queue = require('bull');
// const fileQueue = new Queue('');
const Bull = require('bull');
const { ObjectId } = require('mongodb');
const imageThumbnail = require('image-thumbnail');
const fs = require('fs');
const util = require('util');
const dbClient = require('./utils/db');

const stat = util.promisify(fs.stat);

const fileQueue = new Bull('fileQueue');

fileQueue.process(async (job, done) => {
  if (!job.data.fileId) {
    throw new Error('Missing fileId');
  }
  if (!job.data.userId) {
    throw new Error('Missing userId');
  }

  const file = await dbClient.db.collection('files').findOne({ userId: new ObjectId(job.data.userId), _id: new ObjectId(job.data.fileId) });
  console.log(file);
  if (!file) {
    throw new Error('File not found');
  }
  const widths = [500, 250, 100];
  for (const width of widths) {
    const options = {
      width,
    };
    try {
      const thumbnail = await imageThumbnail(file.localPath, options);
      const thumbnailPath = `${file.localPath}_${width}`;
      // console.log(thumbnail)
      // console.log(thumbnailPath);
      await fs.promises.writeFile(thumbnailPath, thumbnail, (err) => {
        if (err) {
          console.log(err);
        }
      });
      // const thumbnailStats = await stat(thumbnailPath);
      // const thumbnailSize = thumbnailStats.size;
      // console.log(`Thumbnail size (${width}px): ${thumbnailSize} bytes`);
    } catch (err) {
      console.log(err);
    }
  }
  done();
});
