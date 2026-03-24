import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const configSchema = z.object({
  node_env: z.enum(['development', 'production', 'test']).default('development'),
  port: z.coerce.number().default(3000),
  host: z.string().default('0.0.0.0'),
  
  supabase: z.object({
    url: z.string().url(),
    anonKey: z.string(),
    serviceKey: z.string(),
  }),
  
  redis: z.object({
    host: z.string().default('localhost'),
    port: z.coerce.number().default(6379),
    password: z.string().optional(),
  }),
  
  openai: z.object({
    apiKey: z.string().optional(),
    model: z.string().default('gpt-4-turbo-preview'),
  }).optional(),
  
  groq: z.object({
    apiKey: z.string(),
    model: z.string().default('llama-3.3-70b-versatile'),
  }).optional(),
  
  jwt: z.object({
    secret: z.string(),
    expiresIn: z.string().default('7d'),
  }),
  
  rateLimit: z.object({
    max: z.coerce.number().default(100),
    window: z.coerce.number().default(60000),
  }),
  
  logging: z.object({
    level: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  }),
});

const rawConfig = {
  node_env: process.env.NODE_ENV,
  port: process.env.PORT,
  host: process.env.HOST,
  
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceKey: process.env.SUPABASE_SERVICE_KEY,
  },
  
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
  },
  
  openai: process.env.OPENAI_API_KEY ? {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL,
  } : undefined,
  
  groq: process.env.GROQ_API_KEY ? {
    apiKey: process.env.GROQ_API_KEY,
    model: process.env.GROQ_MODEL,
  } : undefined,
  
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN,
  },
  
  rateLimit: {
    max: process.env.RATE_LIMIT_MAX,
    window: process.env.RATE_LIMIT_WINDOW,
  },
  
  logging: {
    level: process.env.LOG_LEVEL,
  },
};

export const config = configSchema.parse(rawConfig);
export type Config = z.infer<typeof configSchema>;
