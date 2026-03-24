import { BaseRepository } from './base/BaseRepository.js';
import { supabase } from '../config/database.js';

export interface Conversation {
  id: string;
  user_id: string;
  title?: string;
  context: any;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export class ConversationRepository extends BaseRepository<Conversation> {
  constructor() {
    super('conversations');
  }

  async findByUserId(userId: string, limit: number = 50): Promise<Conversation[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data as Conversation[]) || [];
    } catch (error: any) {
      return [];
    }
  }
}
