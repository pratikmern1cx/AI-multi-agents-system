import { BaseRepository } from './base/BaseRepository.js';
import { supabase } from '../config/database.js';

export interface Message {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  agent_id?: string;
  metadata: any;
  created_at: Date;
}

export class MessageRepository extends BaseRepository<Message> {
  constructor() {
    super('messages');
  }

  async findByConversationId(conversationId: string, limit: number = 100): Promise<Message[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return (data as Message[]) || [];
    } catch (error: any) {
      return [];
    }
  }
}
