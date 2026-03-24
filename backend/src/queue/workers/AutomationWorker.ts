import { Job } from 'bullmq';
import { logger } from '../../utils/logger.js';
import { supabase } from '../../config/database.js';
import { QueueManager } from '../QueueManager.js';

export interface AutomationJobData {
  automationId: string;
  userId: string;
  triggerType: 'time' | 'event' | 'webhook';
  triggerData?: any;
}

export class AutomationWorker {
  constructor(private queueManager: QueueManager) {}

  async process(job: Job<AutomationJobData>): Promise<any> {
    const { automationId, userId, triggerType, triggerData } = job.data;

    logger.info(`[AutomationWorker] Processing automation ${automationId}`, {
      triggerType,
    });

    try {
      // Get automation workflow
      const { data: workflow, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('id', automationId)
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (error || !workflow) {
        throw new Error(`Automation workflow ${automationId} not found or inactive`);
      }

      await job.updateProgress(20);

      // Create workflow execution record
      const { data: execution } = await supabase
        .from('workflow_executions')
        .insert({
          workflow_id: workflow.id,
          status: 'running',
          trigger_data: triggerData,
          steps_total: workflow.steps?.length || 0,
          steps_completed: 0,
        })
        .select()
        .single();

      if (!execution) {
        throw new Error('Failed to create workflow execution');
      }

      await job.updateProgress(40);

      // Add to workflow queue
      await this.queueManager.addJob('workflowQueue', 'executeWorkflow', {
        workflowId: workflow.id,
        executionId: execution.id,
        userId,
        triggerData,
      });

      await job.updateProgress(100);

      logger.info(`[AutomationWorker] Automation ${automationId} triggered successfully`);

      return {
        success: true,
        automationId,
        executionId: execution.id,
      };
    } catch (error: any) {
      logger.error(`[AutomationWorker] Automation ${automationId} failed`, error);
      throw error;
    }
  }
}
