import Groq from 'groq-sdk';
import { config } from './index.js';

export const groq = new Groq({
  apiKey: config.groq?.apiKey || process.env.GROQ_API_KEY,
});

export const DEFAULT_MODEL = config.groq?.model || 'llama-3.3-70b-versatile';

// Groq models available (as of March 2026):
// - llama-3.3-70b-versatile (recommended for general use) ⭐ NEW
// - llama-3.1-8b-instant (faster, good for simple tasks)
// - mixtral-8x7b-32768 (good for long context)
// - gemma2-9b-it (efficient for chat)
