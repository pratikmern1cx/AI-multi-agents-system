import { aiService } from '../../services/ai.service.js';
import { logger } from '../../utils/logger.js';

export interface Intent {
  category: string;
  confidence: number;
  entities: Record<string, any>;
}

export class IntentDetector {
  private systemPrompt = `You are an intent classification system. Analyze user input and classify it into one of these categories:
- information_request: User wants information or research
- task_execution: User wants to perform an action (send email, schedule, etc.)
- planning: User wants to plan or organize something
- analysis: User wants data analysis or review
- conversation: General conversation or clarification

Return JSON: { "category": "...", "confidence": 0.0-1.0, "entities": {...} }`;

  async detect(userInput: string): Promise<Intent> {
    try {
      const result = await aiService.createStructuredOutput(
        [
          { role: 'system', content: this.systemPrompt },
          { role: 'user', content: userInput },
        ],
        {
          category: 'string',
          confidence: 'number',
          entities: 'object',
        },
        { temperature: 0.3 }
      );
      
      logger.info('[IntentDetector] Intent detected', result);
      
      return {
        category: result.category || 'conversation',
        confidence: result.confidence || 0.5,
        entities: result.entities || {},
      };
    } catch (error: any) {
      logger.error('[IntentDetector] Detection failed', error);
      return {
        category: 'conversation',
        confidence: 0.3,
        entities: {},
      };
    }
  }
}
