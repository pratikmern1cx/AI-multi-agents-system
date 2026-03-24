import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

// Dynamic imports based on available API keys
let aiClient: any;
let defaultModel: string;
let aiProvider: 'openai' | 'groq';

async function initializeAI() {
  if (config.groq?.apiKey) {
    // Use Groq
    const Groq = (await import('groq-sdk')).default;
    aiClient = new Groq({ apiKey: config.groq.apiKey });
    defaultModel = config.groq.model || 'llama-3.3-70b-versatile';
    aiProvider = 'groq';
    logger.info('AI Service initialized with Groq');
  } else if (config.openai?.apiKey) {
    // Use OpenAI
    const OpenAI = (await import('openai')).default;
    aiClient = new OpenAI({ apiKey: config.openai.apiKey });
    defaultModel = config.openai.model || 'gpt-4-turbo-preview';
    aiProvider = 'openai';
    logger.info('AI Service initialized with OpenAI');
  } else {
    throw new Error('No AI API key configured. Please set GROQ_API_KEY or OPENAI_API_KEY');
  }
}

// Initialize on module load
await initializeAI();

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export class AIService {
  async createChatCompletion(
    messages: ChatMessage[],
    options: ChatCompletionOptions = {}
  ): Promise<string> {
    try {
      const model = options.model || defaultModel;
      const temperature = options.temperature ?? 0.7;
      const maxTokens = options.maxTokens ?? 2000;

      logger.info(`[AIService] Creating chat completion with ${aiProvider}`, {
        model,
        messageCount: messages.length,
      });

      const response = await aiClient.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      });

      const content = response.choices[0]?.message?.content || '';
      
      logger.info(`[AIService] Chat completion successful`, {
        provider: aiProvider,
        tokensUsed: response.usage?.total_tokens,
      });

      return content;
    } catch (error: any) {
      logger.error(`[AIService] Chat completion failed: ${error.message}`, {
        error: error.stack,
        provider: aiProvider,
        model: options.model || defaultModel,
      });
      throw new Error(`AI completion failed: ${error.message}`);
    }
  }

  async createEmbedding(text: string): Promise<number[]> {
    try {
      if (aiProvider === 'groq') {
        // Groq doesn't support embeddings, fallback to a simple hash-based approach
        // In production, you'd want to use a dedicated embedding service
        logger.warn('[AIService] Groq does not support embeddings, using fallback');
        return this.createFallbackEmbedding(text);
      }

      // OpenAI embeddings
      const response = await aiClient.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text,
      });

      return response.data[0].embedding;
    } catch (error: any) {
      logger.error('[AIService] Embedding creation failed', error);
      throw new Error(`Embedding creation failed: ${error.message}`);
    }
  }

  private createFallbackEmbedding(text: string): number[] {
    // Simple fallback: create a deterministic embedding from text
    // This is NOT suitable for production semantic search
    const embedding = new Array(1536).fill(0);
    for (let i = 0; i < text.length && i < 1536; i++) {
      embedding[i] = text.charCodeAt(i) / 255;
    }
    return embedding;
  }

  async createStructuredOutput(
    messages: ChatMessage[],
    schema: any,
    options: ChatCompletionOptions = {}
  ): Promise<any> {
    try {
      const model = options.model || defaultModel;
      const temperature = options.temperature ?? 0.7;

      logger.info(`[AIService] Creating structured output with ${aiProvider}`);

      if (aiProvider === 'groq') {
        // Groq: Use JSON mode
        const response = await aiClient.chat.completions.create({
          model,
          messages: [
            ...messages,
            {
              role: 'system',
              content: `You must respond with valid JSON matching this schema: ${JSON.stringify(schema)}`,
            },
          ],
          temperature,
          response_format: { type: 'json_object' },
        });

        const content = response.choices[0]?.message?.content || '{}';
        return JSON.parse(content);
      } else {
        // OpenAI: Use function calling or JSON mode
        const response = await aiClient.chat.completions.create({
          model,
          messages,
          temperature,
          response_format: { type: 'json_object' },
        });

        const content = response.choices[0]?.message?.content || '{}';
        return JSON.parse(content);
      }
    } catch (error: any) {
      logger.error(`[AIService] Structured output creation failed: ${error.message}`, {
        error: error.stack,
        provider: aiProvider,
        model: options.model || defaultModel,
      });
      throw new Error(`Structured output creation failed: ${error.message}`);
    }
  }

  getProvider(): string {
    return aiProvider;
  }

  getModel(): string {
    return defaultModel;
  }
}

export const aiService = new AIService();
