import { supabase } from '../../config/database.js';
import { logger } from '../../utils/logger.js';

export abstract class BaseRepository<T> {
  constructor(protected tableName: string) {}

  async findById(id: string): Promise<T | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as T;
    } catch (error: any) {
      logger.error(`[${this.tableName}] FindById failed`, error);
      return null;
    }
  }

  async findAll(filters?: Record<string, any>): Promise<T[]> {
    try {
      let query = supabase.from(this.tableName).select('*');

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data as T[]) || [];
    } catch (error: any) {
      logger.error(`[${this.tableName}] FindAll failed`, error);
      return [];
    }
  }

  async create(data: Partial<T>): Promise<T | null> {
    try {
      const { data: result, error } = await supabase
        .from(this.tableName)
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result as T;
    } catch (error: any) {
      logger.error(`[${this.tableName}] Create failed`, error);
      throw error;
    }
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    try {
      const { data: result, error } = await supabase
        .from(this.tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result as T;
    } catch (error: any) {
      logger.error(`[${this.tableName}] Update failed`, error);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error: any) {
      logger.error(`[${this.tableName}] Delete failed`, error);
      return false;
    }
  }
}
