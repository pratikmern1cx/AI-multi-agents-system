import { BaseRepository } from './base/BaseRepository.js';
import { supabase } from '../config/database.js';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  full_name?: string;
  role: string;
  settings: any;
  created_at: Date;
  updated_at: Date;
  last_login_at?: Date;
}

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super('users');
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('email', email)
        .single();

      if (error) throw error;
      return data as User;
    } catch (error: any) {
      return null;
    }
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.update(userId, { last_login_at: new Date() } as any);
  }
}
