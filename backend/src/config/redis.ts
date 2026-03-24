import { createClient } from 'redis';
import { config } from './index.js';
import { logger } from '../utils/logger.js';

const redisOptions = config.redis.url
  ? {
      url: config.redis.url,
      password: config.redis.password,
      socket: config.redis.url.startsWith('rediss://') ? { tls: true } : undefined,
    }
  : {
      socket: {
        host: config.redis.host,
        port: config.redis.port,
      },
      password: config.redis.password,
    };

export const redis = createClient(redisOptions);

export function getBullMQConnection() {
  if (config.redis.url) {
    const url = new URL(config.redis.url);
    const port = url.port ? Number(url.port) : 6379;
    const password = url.password || config.redis.password;
    const username = url.username || undefined;
    const isTls = url.protocol === 'rediss:';

    return {
      host: url.hostname,
      port,
      password,
      username,
      tls: isTls ? {} : undefined,
    };
  }

  return {
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
  };
}

redis.on('error', (err) => logger.error({ err, code: (err as any)?.code }, 'Redis Client Error'));
redis.on('connect', () => logger.info('Redis connected'));

export async function connectRedis() {
  await redis.connect();
}

export async function disconnectRedis() {
  await redis.quit();
}
