import { v4 as uuidv4 } from 'uuid';
import { IAgent } from '../base/AgentInterface.js';
import { AgentRegistry } from '../registry/AgentRegistry.js';
import { IntentDetector } from './IntentDetector.js';
import { TaskPlanner } from './TaskPlanner.js';
import { AgentContext } from '../../types/agent.types.js';
import { Task, TaskStatus } from '../../types/task.types.js';
import { logger } from '../../utils/logger.js';
import { MemoryManager } from '../../memory/MemoryManager.js';
import { aiService } from '../../services/ai.service.js';

export class Orchestrator {
  private agentRegistry: AgentRegistry;
  private intentDetector: IntentDetector;
  private taskPlanner: TaskPlanner;
  private memoryManager: MemoryManager;

  constructor(
    agentRegistry: AgentRegistry,
    memoryManager: MemoryManager
  ) {
    this.agentRegistry = agentRegistry;
    this.intentDetector = new IntentDetector();
    this.taskPlanner = new TaskPlanner();
    this.memoryManager = memoryManager;
  }

  async processRequest(
    userInput: string,
    context: AgentContext
  ): Promise<any> {
    logger.info('[Orchestrator] Processing request', { userInput });

    try {
      // Step 1: Detect intent
      const intent = await this.intentDetector.detect(userInput);
      logger.info('[Orchestrator] Intent detected', { intent });

      // Step 2: Retrieve relevant memory
      const relevantMemory = await this.memoryManager.retrieve(
        context.userId,
        userInput,
        5
      );
      context.longTermMemory = relevantMemory;

      // Step 3: Create task plan
      const tasks = await this.taskPlanner.createPlan(userInput, intent);
      logger.info('[Orchestrator] Task plan created', { taskCount: tasks.length });

      // Step 4: Execute tasks
      const results = await this.executeTasks(tasks, context);

      // Step 5: Aggregate results
      const finalResult = await this.aggregateResults(userInput, results);

      // Step 6: Store in memory
      await this.memoryManager.store(
        context.userId,
        context.conversationId,
        userInput,
        finalResult
      );

      return {
        success: true,
        intent,
        tasks: tasks.map(t => ({ id: t.id, title: t.title, status: t.status })),
        result: finalResult,
      };
    } catch (error: any) {
      logger.error('[Orchestrator] Processing failed', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private async executeTasks(
    tasks: Task[],
    context: AgentContext
  ): Promise<Map<string, any>> {
    const results = new Map<string, any>();

    for (const task of tasks) {
      try {
        logger.info(`[Orchestrator] Executing task: ${task.title}`);
        
        // Find appropriate agent
        const agent = this.selectAgent(task);
        if (!agent) {
          throw new Error(`No agent found for task type: ${task.type}`);
        }

        // Execute with retry logic
        const result = await this.executeWithRetry(
          agent,
          task,
          context,
          task.maxRetries || 3
        );

        results.set(task.id, result);
        task.status = 'completed';
        task.output = result.data;
      } catch (error: any) {
        logger.error(`[Orchestrator] Task failed: ${task.title}`, error);
        task.status = 'failed';
        task.errorMessage = error.message;
        results.set(task.id, { success: false, error: error.message });
      }
    }

    return results;
  }

  private async executeWithRetry(
    agent: IAgent,
    task: Task,
    context: AgentContext,
    maxRetries: number
  ): Promise<any> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const input = this.buildAgentInput(task);
        const result = await agent.execute(input, context);
        
        if (result.success) {
          return result;
        }
        
        lastError = new Error(result.error || 'Unknown error');
      } catch (error: any) {
        lastError = error;
        logger.warn(`[Orchestrator] Retry ${attempt + 1}/${maxRetries}`, {
          task: task.title,
          error: error.message,
        });
      }

      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        await this.sleep(Math.pow(2, attempt) * 1000);
      }
    }

    throw lastError || new Error('Max retries exceeded');
  }

  private selectAgent(task: Task): IAgent | null {
    // Map task type to agent type
    const agentTypeMap: Record<string, string> = {
      planning: 'planner',
      research: 'research',
      execution: 'execution',
      review: 'review',
    };

    const agentType = agentTypeMap[task.type] || task.type;
    return this.agentRegistry.getAgentByType(agentType);
  }

  private buildAgentInput(task: Task): string {
    return `Task: ${task.title}\n\nDescription: ${task.description}\n\nInput: ${JSON.stringify(task.input)}`;
  }

  private async aggregateResults(userInput: string, results: Map<string, any>): Promise<any> {
    const successfulResults = Array.from(results.values())
      .filter(r => r.success)
      .map(r => {
        if (typeof r.data === 'string') return r.data;
        return JSON.stringify(r.data);
      });

    if (successfulResults.length === 0) {
      return 'I am sorry, but I was unable to complete the tasks for your request. Please try again.';
    }

    const compiledResults = successfulResults.join('\n\n---\n\n');

    try {
      logger.info('[Orchestrator] Synthesizing final response');
      const finalResponse = await aiService.createChatCompletion([
        { 
          role: 'system', 
          content: 'You are a warm, helpful, and friendly AI assistant. Give a clear, direct, and conversational answer based on the task outputs. Answer the user\'s original request. DO NOT show any raw JSON from the internal task outputs. Explain the information simply to the user. DO NOT use bolding symbols (like **) in your output. Use bullet points (starting with *) if needed.'
        },
        { 
          role: 'user', 
          content: `User's Original Request: ${userInput}\n\nInternal Task Outputs (for context):\n${compiledResults}\n\nPlease generate a very friendly and human-readable response based on the above.` 
        }
      ], {
        temperature: 0.7,
        maxTokens: 2000
      });
      return finalResponse;
    } catch (error) {
      logger.error('[Orchestrator] Final synthesis failed', error);
      // Fallback
      if (successfulResults.length === 1) {
        return successfulResults[0];
      }
      return compiledResults;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
