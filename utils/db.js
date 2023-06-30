// import { MongoClient } from 'mongodb'; ES6 moodule syntax
const { MongoClient } = require('mongodb'); // Common JS Syntax

const HOST = process.env.DB_HOST || 'localhost';
const PORT = process.env.DB_PORT || '27017';
const DB = process.env.DB_DATABASE || 'files_manager';
const url = `mongodb://${HOST}:${PORT}`;

class DBClient {
  constructor() {
    this.client = new MongoClient(url, { useUnifiedTopology: true });

    this.client.connect((err, client) => {
      // MongoClient.connect(url, (err, client) => {
      if (!err) {
        this.db = client.db(DB);
      } else {
        this.db = false;
      }
    });
  }

  isAlive() {
    if (this.db) {
      return true;
    }
    return false;
  }

  async nbUsers() {
    return this.db.collection('users').countDocuments();
    // return this.db.users.count(); DEPRECATED
  }

  async nbFiles() {
    return this.db.collection('files').countDocuments();
    // return this.db.files.count(); DEPRECATED
  }
}

const dbClient = new DBClient();
module.exports = dbClient; // CommonJS
// export default dbClient; // ES6 Modules
