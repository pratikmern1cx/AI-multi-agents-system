import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../config/database.js';
import { QueueManager } from '../queue/QueueManager.js';
import { logger } from '../utils/logger.js';
import { NotFoundError } from '../utils/errors.js';

export class TaskService {
  constructor(private queueManager: QueueManager) {}

  async createTask(
    userId: string,
    data: {
      title: string;
      description?: string;
      type: string;
      input?: any;
      priority?: number;
    }
  ) {
    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        user_id: userId,
        title: data.title,
        description: data.description,
        type: data.type,
        status: 'pending',
        priority: data.priority || 0,
        input: data.input || {},
        output: {},
      })
      .select()
      .single();

    if (error) throw error;

    logger.info('[TaskService] Task created', { taskId: task.id });

    // Add to queue
    await this.queueManager.addJob(
      'taskQueue',
      'executeTask',
      {
        taskId: task.id,
        userId,
        input: data.description || data.title,
        type: data.type,
      },
      {
        priority: data.priority,
      }
    );

    return task;
  }

  async getTask(taskId: string, userId: string) {
    const { data: task, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .eq('user_id', userId)
      .single();

    if (error || !task) {
      throw new NotFoundError('Task not found');
    }

    return task;
  }

  async listTasks(userId: string, filters?: { status?: string; type?: string }) {
    let query = supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.type) {
      query = query.eq('type', filters.type);
    }

    const { data: tasks, error } = await query;

    if (error) throw error;

    return tasks || [];
  }

  async cancelTask(taskId: string, userId: string) {
    const task = await this.getTask(taskId, userId);

    if (task.status === 'completed' || task.status === 'failed') {
      throw new Error('Cannot cancel completed or failed task');
    }

    const { error } = await supabase
      .from('tasks')
      .update({ status: 'cancelled' })
      .eq('id', taskId);

    if (error) throw error;

    logger.info('[TaskService] Task cancelled', { taskId });

    return { success: true };
  }

  async retryTask(taskId: string, userId: string) {
    const task = await this.getTask(taskId, userId);

    if (task.status !== 'failed') {
      throw new Error('Can only retry failed tasks');
    }

    // Reset task status
    const { error } = await supabase
      .from('tasks')
      .update({
        status: 'pending',
        retry_count: task.retry_count + 1,
        error_message: null,
      })
      .eq('id', taskId);

    if (error) throw error;

    // Add back to queue
    await this.queueManager.addJob('taskQueue', 'executeTask', {
      taskId: task.id,
      userId,
      input: task.description || task.title,
      type: task.type,
    });

    logger.info('[TaskService] Task retry queued', { taskId });

    return { success: true };
  }
}
