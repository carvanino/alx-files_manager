import redis from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    this.client = redis.createClient();

    this.client.on('error', (err) => {
      this.client.connected = false;
      console.log(`${err}`);
    });

    this.client.connected = true;
  }

  isAlive() {
    return this.client.connected;
    /*
    this.client.ping((err, reply) => {
      if (!err) {
        console.log('REPLY', reply);
        callback(true);
      } else {
        console.log('ERR', err);
        callback(false);
      }
    })
    //return this.client.connected;
    if (this.client.connected) {
      return true;

    return false;
    */
  }

  async get(key) {
    const geT = promisify(this.client.get).bind(this.client);
    const value = await geT(key);
    return value;
  }

  async set(key, value, dur) {
    // const seT = promisify(this.client.setex).bind(this.client);
    // seT(key, dur, value);
    this.client.setex(key, dur, value);
  }

  async del(key) {
    this.client.del(key);
  }
}

const redisClient = new RedisClient();

export default redisClient;
