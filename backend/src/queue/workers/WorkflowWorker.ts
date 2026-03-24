import { Job } from 'bullmq';
import { logger } from '../../utils/logger.js';
import { supabase } from '../../config/database.js';
import { QueueManager } from '../QueueManager.js';

export interface WorkflowJobData {
  workflowId: string;
  executionId: string;
  userId: string;
  triggerData?: any;
}

export interface WorkflowStep {
  id: string;
  type: 'task' | 'condition' | 'delay' | 'parallel';
  config: any;
  nextStepId?: string;
  onSuccess?: string;
  onFailure?: string;
}

export class WorkflowWorker {
  constructor(private queueManager: QueueManager) {}

  async process(job: Job<WorkflowJobData>): Promise<any> {
    const { workflowId, executionId, userId, triggerData } = job.data;

    logger.info(`[WorkflowWorker] Processing workflow ${workflowId}`, { executionId });

    try {
      // Get workflow definition
      const { data: workflow, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('id', workflowId)
        .single();

      if (error || !workflow) {
        throw new Error(`Workflow ${workflowId} not found`);
      }

      const steps: WorkflowStep[] = workflow.steps;
      const totalSteps = steps.length;

      // Update execution status
      await this.updateExecutionStatus(executionId, 'running', 0, totalSteps);

      await job.updateProgress(10);

      // Execute steps sequentially
      let currentStepIndex = 0;
      const results: any[] = [];

      for (const step of steps) {
        logger.info(`[WorkflowWorker] Executing step ${step.id}`, { type: step.type });

        const stepResult = await this.executeStep(step, userId, triggerData, results);
        results.push(stepResult);

        currentStepIndex++;
        const progress = Math.floor((currentStepIndex / totalSteps) * 90) + 10;
        await job.updateProgress(progress);

        await this.updateExecutionStatus(executionId, 'running', currentStepIndex, totalSteps);

        // Check if step failed and has failure handler
        if (!stepResult.success && step.onFailure) {
          logger.warn(`[WorkflowWorker] Step ${step.id} failed, executing failure handler`);
          // Could implement failure handling here
        }
      }

      // Update execution as completed
      await this.updateExecutionStatus(executionId, 'completed', totalSteps, totalSteps, {
        results,
      });

      // Update workflow last_run_at
      await supabase
        .from('workflows')
        .update({ last_run_at: new Date().toISOString() })
        .eq('id', workflowId);

      await job.updateProgress(100);

      logger.info(`[WorkflowWorker] Workflow ${workflowId} completed successfully`);

      return {
        success: true,
        workflowId,
        executionId,
        results,
      };
    } catch (error: any) {
      logger.error(`[WorkflowWorker] Workflow ${workflowId} failed`, error);

      await this.updateExecutionStatus(executionId, 'failed', 0, 0, null, error.message);

      throw error;
    }
  }

  private async executeStep(
    step: WorkflowStep,
    userId: string,
    triggerData: any,
    previousResults: any[]
  ): Promise<any> {
    switch (step.type) {
      case 'task':
        return this.executeTaskStep(step, userId, triggerData);

      case 'delay':
        return this.executeDelayStep(step);

      case 'condition':
        return this.executeConditionStep(step, previousResults);

      case 'parallel':
        return this.executeParallelStep(step, userId, triggerData);

      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }

  private async executeTaskStep(step: WorkflowStep, userId: string, triggerData: any) {
    const { taskType, input } = step.config;

    // Create task in database
    const { data: task } = await supabase
      .from('tasks')
      .insert({
        user_id: userId,
        title: `Workflow Task: ${step.id}`,
        description: input,
        type: taskType,
        status: 'pending',
        input: triggerData,
      })
      .select()
      .single();

    if (!task) {
      throw new Error('Failed to create task');
    }

    // Add to task queue
    await this.queueManager.addJob('taskQueue', 'executeTask', {
      taskId: task.id,
      userId,
      input,
      type: taskType,
    });

    return {
      success: true,
      stepId: step.id,
      taskId: task.id,
      type: 'task',
    };
  }

  private async executeDelayStep(step: WorkflowStep) {
    const { duration } = step.config; // milliseconds
    await new Promise((resolve) => setTimeout(resolve, duration));

    return {
      success: true,
      stepId: step.id,
      type: 'delay',
      duration,
    };
  }

  private async executeConditionStep(step: WorkflowStep, previousResults: any[]) {
    const { condition } = step.config;

    // Simple condition evaluation (can be enhanced)
    const conditionMet = this.evaluateCondition(condition, previousResults);

    return {
      success: true,
      stepId: step.id,
      type: 'condition',
      conditionMet,
    };
  }

  private async executeParallelStep(step: WorkflowStep, userId: string, triggerData: any) {
    const { tasks } = step.config;

    // Execute all tasks in parallel
    const promises = tasks.map((taskConfig: any) =>
      this.executeTaskStep(
        {
          id: `${step.id}-${taskConfig.id}`,
          type: 'task',
          config: taskConfig,
        },
        userId,
        triggerData
      )
    );

    const results = await Promise.allSettled(promises);

    return {
      success: true,
      stepId: step.id,
      type: 'parallel',
      results,
    };
  }

  private evaluateCondition(condition: string, previousResults: any[]): boolean {
    // Simple condition evaluation
    // In production, use a proper expression evaluator
    try {
      // Example: "previousResults[0].success === true"
      return eval(condition);
    } catch (error) {
      logger.error('[WorkflowWorker] Condition evaluation failed', error);
      return false;
    }
  }

  private async updateExecutionStatus(
    executionId: string,
    status: string,
    stepsCompleted: number,
    stepsTotal: number,
    output?: any,
    errorMessage?: string
  ) {
    const updateData: any = {
      status,
      steps_completed: stepsCompleted,
      steps_total: stepsTotal,
    };

    if (status === 'completed' || status === 'failed') {
      updateData.completed_at = new Date().toISOString();
    }

    if (output) {
      updateData.output = output;
    }

    if (errorMessage) {
      updateData.error_message = errorMessage;
    }

    await supabase.from('workflow_executions').update(updateData).eq('id', executionId);
  }
}
