import OpenAI from 'openai';
import { config } from './index.js';

export const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

export const DEFAULT_MODEL = config.openai.model;
