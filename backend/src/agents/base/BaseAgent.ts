import { v4 as uuidv4 } from 'uuid';
import { IAgent } from './AgentInterface.js';
import { AgentConfig, AgentContext, AgentResult, Tool } from '../../types/agent.types.js';
import { aiService } from '../../services/ai.service.js';
import { logger } from '../../utils/logger.js';

export abstract class BaseAgent implements IAgent {
  public id: string;
  public name: string;
  public type: string;
  public systemPrompt: string;
  public config: AgentConfig;
  public tools: Tool[] = [];

  constructor(
    name: string,
    type: string,
    systemPrompt: string,
    config: AgentConfig
  ) {
    this.id = uuidv4();
    this.name = name;
    this.type = type;
    this.systemPrompt = systemPrompt;
    this.config = config;
  }

  async execute(input: string, context: AgentContext): Promise<AgentResult> {
    const startTime = Date.now();
    
    try {
      logger.info(`[${this.name}] Starting execution`, { input });

      // Build messages
      const messages: any[] = [
        { role: 'system', content: this.systemPrompt },
        { role: 'user', content: input },
      ];

      // Call AI service
      const result = await aiService.createChatCompletion(messages, {
        model: this.config.model,
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens,
      });

      const executionTime = Date.now() - startTime;

      logger.info(`[${this.name}] Execution completed`, { executionTime });

      return {
        success: true,
        data: result,
        metadata: {
          executionTime,
          toolsCalled: [],
        },
      };
    } catch (error: any) {
      logger.error(`[${this.name}] Execution failed`, error);
      return {
        success: false,
        error: error.message,
        metadata: {
          executionTime: Date.now() - startTime,
        },
      };
    }
  }

  addTool(tool: Tool): void {
    this.tools.push(tool);
  }

  removeTool(toolName: string): void {
    this.tools = this.tools.filter(t => t.name !== toolName);
  }
}
