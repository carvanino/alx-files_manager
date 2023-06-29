const { MongoClient } = require('mongodb');

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';
    const url = `mongodb://${host}:${port}`;

    this.db = null;
    const mongoOptions = { useUnifiedTopology: true };

    MongoClient.connect(url, mongoOptions, (err, client) => {
      if (err) {
        console.error('Database connection error:', err);
      } else {
        this.db = client.db(database);
        console.log('Database connected');
      }
    });
  }

  isAlive() {
    return this.db !== null;
  }

  async nbUsers() {
    if (!this.isAlive()) {
      return 0;
    }

    const count = await this.db.collection('users').countDocuments();
    return count;
  }

  async nbFiles() {
    if (!this.isAlive()) {
      return 0;
    }

    const count = await this.db.collection('files').countDocuments();
    return count;
  }
}

const dbClient = new DBClient();
module.exports = dbClient;
