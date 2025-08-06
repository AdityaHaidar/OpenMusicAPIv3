const redis = require('redis');

class CacheService {
  constructor() {
    this.client = redis.createClient({
      socket: {
        host: process.env.REDIS_SERVER,
      },
    });

    this.client.on('error', (error) => {
      console.error(error);
    });

    this.client.connect();
  }

  async set(key, value, expirationInSecond = 1800) {
    await this.client.setEx(key, expirationInSecond, value);
  }

  async get(key) {
    const result = await this.client.get(key);
    return result;
  }

  async delete(key) {
    return this.client.del(key);
  }
}

module.exports = CacheService;
