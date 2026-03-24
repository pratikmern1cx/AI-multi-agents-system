import { createClient } from '@supabase/supabase-js';
import { config } from './index.js';

export const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: false,
    },
    db: {
      schema: 'public',
    },
  }
);

export type Database = typeof supabase;
