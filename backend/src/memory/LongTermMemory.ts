import { supabase } from '../config/database.js';
import { aiService } from '../services/ai.service.js';
import { logger } from '../utils/logger.js';

export class LongTermMemory {
  async store(
    userId: string,
    conversationId: string,
    content: string,
    metadata: any
  ): Promise<void> {
    try {
      // Generate embedding
      const embedding = await this.generateEmbedding(content);

      // Store in Supabase
      const { error } = await supabase
        .from('memory_embeddings')
        .insert({
          user_id: userId,
          conversation_id: conversationId,
          content,
          embedding,
          metadata: { output: metadata },
        });

      if (error) throw error;

      logger.info('[LongTermMemory] Stored', { userId, conversationId });
    } catch (error: any) {
      logger.error('[LongTermMemory] Store failed', error);
      throw error;
    }
  }

  async retrieve(
    userId: string,
    query: string,
    limit: number = 5
  ): Promise<any[]> {
    try {
      // Generate query embedding
      const queryEmbedding = await this.generateEmbedding(query);

      // Semantic search using pgvector
      const { data, error } = await supabase.rpc('match_memory_embeddings', {
        query_embedding: queryEmbedding,
        match_threshold: 0.7,
        match_count: limit,
        filter_user_id: userId,
      });

      if (error) throw error;

      logger.info('[LongTermMemory] Retrieved', { 
        userId, 
        count: data?.length || 0 
      });

      return data || [];
    } catch (error: any) {
      logger.error('[LongTermMemory] Retrieve failed', error);
      return [];
    }
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      return await aiService.createEmbedding(text);
    } catch (error: any) {
      logger.error('[LongTermMemory] Embedding generation failed', error);
      throw error;
    }
  }
}
