import { Tool } from '../../types/agent.types.js';
import { logger } from '../../utils/logger.js';

export abstract class BaseTool implements Tool {
  public name: string;
  public description: string;
  public parameters: any;

  constructor(name: string, description: string, parameters: any) {
    this.name = name;
    this.description = description;
    this.parameters = parameters;
  }

  abstract execute(params: any): Promise<any>;

  protected async executeWithLogging(params: any, executeFn: () => Promise<any>): Promise<any> {
    const startTime = Date.now();
    logger.info(`[${this.name}] Executing tool`, { params });

    try {
      const result = await executeFn();
      const executionTime = Date.now() - startTime;

      logger.info(`[${this.name}] Tool executed successfully`, { executionTime });

      return {
        success: true,
        data: result,
        executionTime,
      };
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      logger.error(`[${this.name}] Tool execution failed`, error);

      return {
        success: false,
        error: error.message,
        executionTime,
      };
    }
  }
}
