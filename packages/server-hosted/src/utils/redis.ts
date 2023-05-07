import { createClient } from 'redis';

const redis = createClient();

export const initRedisServer = async () => {
  redis.on('error', (err) => {
    throw new Error(`Redis connection error: ${err}`);
  });
  await redis.connect();
};

export const redisInstance: ReturnType<typeof createClient> = redis;

