import { ShortTermMemory } from './ShortTermMemory.js';
import { LongTermMemory } from './LongTermMemory.js';
import { logger } from '../utils/logger.js';

export class MemoryManager {
  private shortTerm: ShortTermMemory;
  private longTerm: LongTermMemory;

  constructor() {
    this.shortTerm = new ShortTermMemory();
    this.longTerm = new LongTermMemory();
  }

  async store(
    userId: string,
    conversationId: string,
    input: string,
    output: any
  ): Promise<void> {
    try {
      // Store in short-term (Redis)
      await this.shortTerm.set(conversationId, {
        input,
        output,
        timestamp: new Date(),
      });

      // Store in long-term (Supabase with embeddings)
      await this.longTerm.store(userId, conversationId, input, output);

      logger.info('[MemoryManager] Memory stored', { userId, conversationId });
    } catch (error: any) {
      logger.error('[MemoryManager] Store failed', error);
    }
  }

  async retrieve(
    userId: string,
    query: string,
    limit: number = 5
  ): Promise<any[]> {
    try {
      // Retrieve from long-term using semantic search
      const memories = await this.longTerm.retrieve(userId, query, limit);
      
      logger.info('[MemoryManager] Memory retrieved', { 
        userId, 
        count: memories.length 
      });

      return memories;
    } catch (error: any) {
      logger.error('[MemoryManager] Retrieve failed', error);
      return [];
    }
  }

  async getSessionContext(conversationId: string): Promise<any> {
    return this.shortTerm.get(conversationId);
  }

  async clearSession(conversationId: string): Promise<void> {
    await this.shortTerm.delete(conversationId);
  }
}
