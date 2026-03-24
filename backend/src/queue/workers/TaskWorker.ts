import { Job } from 'bullmq';
import { logger } from '../../utils/logger.js';
import { Orchestrator } from '../../agents/orchestrator/Orchestrator.js';
import { AgentContext } from '../../types/agent.types.js';
import { supabase } from '../../config/database.js';

export interface TaskJobData {
  taskId: string;
  userId: string;
  conversationId?: string;
  input: string;
  type: string;
}

export class TaskWorker {
  constructor(private orchestrator: Orchestrator) {}

  async process(job: Job<TaskJobData>): Promise<any> {
    const { taskId, userId, conversationId, input, type } = job.data;

    logger.info(`[TaskWorker] Processing task ${taskId}`, { type });

    try {
      // Update task status to running
      await this.updateTaskStatus(taskId, 'running');

      // Update job progress
      await job.updateProgress(10);

      // Create agent context
      const context: AgentContext = {
        conversationId: conversationId || taskId,
        userId,
        sessionMemory: new Map(),
      };

      await job.updateProgress(20);

      // Process with orchestrator
      const result = await this.orchestrator.processRequest(input, context);

      await job.updateProgress(80);

      // Update task with result
      await this.updateTaskStatus(taskId, 'completed', result);

      await job.updateProgress(100);

      logger.info(`[TaskWorker] Task ${taskId} completed successfully`);

      return {
        success: true,
        taskId,
        result,
      };
    } catch (error: any) {
      logger.error(`[TaskWorker] Task ${taskId} failed`, error);

      // Update task status to failed
      await this.updateTaskStatus(taskId, 'failed', null, error.message);

      throw error;
    }
  }

  private async updateTaskStatus(
    taskId: string,
    status: string,
    output?: any,
    errorMessage?: string
  ) {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'running') {
      updateData.started_at = new Date().toISOString();
    }

    if (status === 'completed' || status === 'failed') {
      updateData.completed_at = new Date().toISOString();
    }

    if (output) {
      updateData.output = output;
    }

    if (errorMessage) {
      updateData.error_message = errorMessage;
    }

    await supabase.from('tasks').update(updateData).eq('id', taskId);
  }
}
