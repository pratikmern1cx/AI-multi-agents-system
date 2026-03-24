import { redis } from '../config/redis.js';
import { logger } from '../utils/logger.js';

const TTL = 3600; // 1 hour

export class ShortTermMemory {
  private prefix = 'session:';

  async set(key: string, value: any): Promise<void> {
    try {
      const fullKey = this.prefix + key;
      await redis.setEx(fullKey, TTL, JSON.stringify(value));
    } catch (error: any) {
      logger.error('[ShortTermMemory] Set failed', error);
      throw error;
    }
  }

  async get(key: string): Promise<any | null> {
    try {
      const fullKey = this.prefix + key;
      const value = await redis.get(fullKey);
      return value ? JSON.parse(value) : null;
    } catch (error: any) {
      logger.error('[ShortTermMemory] Get failed', error);
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const fullKey = this.prefix + key;
      await redis.del(fullKey);
    } catch (error: any) {
      logger.error('[ShortTermMemory] Delete failed', error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const fullKey = this.prefix + key;
      const result = await redis.exists(fullKey);
      return result === 1;
    } catch (error: any) {
      logger.error('[ShortTermMemory] Exists check failed', error);
      return false;
    }
  }
}
