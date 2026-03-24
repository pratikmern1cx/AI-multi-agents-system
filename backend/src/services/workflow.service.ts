import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../config/database.js';
import { QueueManager } from '../queue/QueueManager.js';
import { logger } from '../utils/logger.js';
import { NotFoundError } from '../utils/errors.js';
import cronParser from 'cron-parser';

export class WorkflowService {
  constructor(private queueManager: QueueManager) {}

  async createWorkflow(
    userId: string,
    data: {
      name: string;
      description?: string;
      triggerType: 'manual' | 'scheduled' | 'event' | 'webhook';
      triggerConfig?: any;
      steps: any[];
    }
  ) {
    const { data: workflow, error } = await supabase
      .from('workflows')
      .insert({
        user_id: userId,
        name: data.name,
        description: data.description,
        trigger_type: data.triggerType,
        trigger_config: data.triggerConfig || {},
        steps: data.steps,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    logger.info('[WorkflowService] Workflow created', { workflowId: workflow.id });

    // If scheduled, set up recurring job
    if (data.triggerType === 'scheduled' && data.triggerConfig?.cron) {
      await this.scheduleWorkflow(workflow.id, userId, data.triggerConfig.cron);
    }

    return workflow;
  }

  async getWorkflow(workflowId: string, userId: string) {
    const { data: workflow, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', workflowId)
      .eq('user_id', userId)
      .single();

    if (error || !workflow) {
      throw new NotFoundError('Workflow not found');
    }

    return workflow;
  }

  async listWorkflows(userId: string, filters?: { triggerType?: string; isActive?: boolean }) {
    let query = supabase
      .from('workflows')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (filters?.triggerType) {
      query = query.eq('trigger_type', filters.triggerType);
    }

    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }

    const { data: workflows, error } = await query;

    if (error) throw error;

    return workflows || [];
  }

  async executeWorkflow(workflowId: string, userId: string, triggerData?: any) {
    const workflow = await this.getWorkflow(workflowId, userId);

    if (!workflow.is_active) {
      throw new Error('Workflow is not active');
    }

    // Create execution record
    const { data: execution } = await supabase
      .from('workflow_executions')
      .insert({
        workflow_id: workflowId,
        status: 'running',
        trigger_data: triggerData || {},
        steps_total: workflow.steps?.length || 0,
        steps_completed: 0,
      })
      .select()
      .single();

    if (!execution) {
      throw new Error('Failed to create workflow execution');
    }

    // Add to workflow queue
    await this.queueManager.addJob('workflowQueue', 'executeWorkflow', {
      workflowId,
      executionId: execution.id,
      userId,
      triggerData,
    });

    logger.info('[WorkflowService] Workflow execution queued', {
      workflowId,
      executionId: execution.id,
    });

    return execution;
  }

  async updateWorkflow(
    workflowId: string,
    userId: string,
    updates: {
      name?: string;
      description?: string;
      steps?: any[];
      isActive?: boolean;
      triggerConfig?: any;
    }
  ) {
    const workflow = await this.getWorkflow(workflowId, userId);

    const { error } = await supabase
      .from('workflows')
      .update({
        name: updates.name,
        description: updates.description,
        steps: updates.steps,
        is_active: updates.isActive,
        trigger_config: updates.triggerConfig,
      })
      .eq('id', workflowId);

    if (error) throw error;

    logger.info('[WorkflowService] Workflow updated', { workflowId });

    return { success: true };
  }

  async deleteWorkflow(workflowId: string, userId: string) {
    await this.getWorkflow(workflowId, userId);

    const { error } = await supabase.from('workflows').delete().eq('id', workflowId);

    if (error) throw error;

    logger.info('[WorkflowService] Workflow deleted', { workflowId });

    return { success: true };
  }

  async getWorkflowExecutions(workflowId: string, userId: string, limit: number = 50) {
    await this.getWorkflow(workflowId, userId);

    const { data: executions, error } = await supabase
      .from('workflow_executions')
      .select('*')
      .eq('workflow_id', workflowId)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return executions || [];
  }

  private async scheduleWorkflow(workflowId: string, userId: string, cronPattern: string) {
    try {
      // Validate cron pattern
      cronParser.parseExpression(cronPattern);

      // Add repeatable job
      await this.queueManager.addJob(
        'automationQueue',
        'scheduledWorkflow',
        {
          automationId: workflowId,
          userId,
          triggerType: 'time',
        },
        {
          repeat: {
            pattern: cronPattern,
          },
        }
      );

      logger.info('[WorkflowService] Workflow scheduled', { workflowId, cronPattern });
    } catch (error: any) {
      logger.error('[WorkflowService] Failed to schedule workflow', error);
      throw new Error(`Invalid cron pattern: ${cronPattern}`);
    }
  }
}
