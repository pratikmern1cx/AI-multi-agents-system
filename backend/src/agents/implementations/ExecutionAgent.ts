import { BaseAgent } from '../base/BaseAgent.js';

export class ExecutionAgent extends BaseAgent {
  constructor() {
    super(
      'Execution Agent',
      'execution',
      `You are a helpful and warm AI assistant. Be friendly, concise, and easy to talk to.

Guidelines:
1. Keep your answers brief and to the point.
2. Use simple, everyday language that anyone can understand.
3. Be friendly and polite in your tone.
4. DO NOT use bolding symbols (like **) in your response.
5. Make your answers clear and helpful.
6. Only give long explanations if specifically asked.`,
      {
        model: 'llama-3.3-70b-versatile',
        temperature: 0.8,
        maxTokens: 800,
      }
    );
  }
}
