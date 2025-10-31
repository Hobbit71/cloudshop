import { createClient, RedisClientType } from 'redis';
import logger from './logger';

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
}

let client: RedisClientType | null = null;

export const createRedisClient = async (config: RedisConfig): Promise<RedisClientType> => {
  if (client?.isOpen) {
    return client;
  }

  const url = config.password
    ? `redis://:${config.password}@${config.host}:${config.port}/${config.db || 0}`
    : `redis://${config.host}:${config.port}/${config.db || 0}`;

  client = createClient({
    url,
  });

  client.on('error', (err) => {
    logger.error('Redis client error', err);
  });

  client.on('connect', () => {
    logger.info('Redis client connected');
  });

  client.on('disconnect', () => {
    logger.warn('Redis client disconnected');
  });

  await client.connect();

  return client;
};

export const getRedisClient = (): RedisClientType => {
  if (!client || !client.isOpen) {
    throw new Error('Redis client not initialized. Call createRedisClient first.');
  }
  return client;
};

export const closeRedisClient = async (): Promise<void> => {
  if (client?.isOpen) {
    await client.quit();
    client = null;
    logger.info('Redis client closed');
  }
};

export const testRedisConnection = async (): Promise<boolean> => {
  try {
    const redisClient = getRedisClient();
    await redisClient.ping();
    return true;
  } catch (error) {
    logger.error('Redis connection test failed', error);
    return false;
  }
};

