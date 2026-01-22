const Redis = require('ioredis');
require('dotenv').config();

if (!process.env.REDIS_URL) {
  console.error("REDIS_URL is missing from .env");
  process.exit(1);
}

const redis = new Redis(process.env.REDIS_URL, {
  enableReadyCheck: false, 
  maxRetriesPerRequest: null,
  family: 0,
  tls: process.env.REDIS_URL.startsWith('rediss://') ? {
    rejectUnauthorized: false
  } : undefined
});

redis.on('error', (err) => {
  console.error('Redis Connection Warning:', err.message);
});

redis.on('connect', () => {
  console.log('Connected to Upstash Redis successfully');
});

module.exports = redis;