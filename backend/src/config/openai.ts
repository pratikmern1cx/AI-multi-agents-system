import OpenAI from 'openai';
import { config } from './index.js';

export const openai = config.openai ? new OpenAI({
  apiKey: config.openai.apiKey,
}) : null;

export const DEFAULT_MODEL = config.openai?.model;
