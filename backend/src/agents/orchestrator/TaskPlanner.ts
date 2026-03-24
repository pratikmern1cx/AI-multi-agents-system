import { v4 as uuidv4 } from 'uuid';
import { aiService } from '../../services/ai.service.js';
import { Task } from '../../types/task.types.js';
import { Intent } from './IntentDetector.js';
import { logger } from '../../utils/logger.js';

export class TaskPlanner {
  private systemPrompt = `You are a task planning system. Break down user requests into actionable tasks.

For each task, specify:
- title: Clear task name
- description: What needs to be done
- type: planning, research, execution, or review
- priority: 0-10 (higher = more important)
- dependencies: Array of task indices that must complete first

Return JSON with tasks array: {"tasks": [{ "title": "...", "description": "...", "type": "...", "priority": 5, "dependencies": [] }]}`;

  async createPlan(userInput: string, intent: Intent): Promise<Task[]> {
    try {
      const result = await aiService.createStructuredOutput(
        [
          { role: 'system', content: this.systemPrompt },
          { 
            role: 'user', 
            content: `Intent: ${intent.category}\n\nRequest: ${userInput}` 
          },
        ],
        {
          tasks: 'array',
        },
        { temperature: 0.5 }
      );

      const taskDefinitions = result.tasks || [];

      // Convert to Task objects
      const tasks: Task[] = taskDefinitions.map((def: any, index: number) => ({
        id: uuidv4(),
        title: def.title,
        description: def.description,
        type: def.type || 'execution',
        status: 'pending' as const,
        priority: def.priority || 0,
        input: {},
        output: {},
        retryCount: 0,
        maxRetries: 3,
        dependencies: def.dependencies || [],
      }));

      logger.info('[TaskPlanner] Plan created', { taskCount: tasks.length });

      return tasks;
    } catch (error: any) {
      logger.error('[TaskPlanner] Planning failed', error);
      
      // Fallback: create single execution task
      return [{
        id: uuidv4(),
        title: 'Execute user request',
        description: userInput,
        type: 'execution',
        status: 'pending',
        priority: 5,
        input: {},
        output: {},
        retryCount: 0,
        maxRetries: 3,
        dependencies: [],
      }];
    }
  }
}
