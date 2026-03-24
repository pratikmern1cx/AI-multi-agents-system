import api from './api';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  priority: number;
  input: any;
  output: any;
  error_message?: string;
  retry_count: number;
  max_retries: number;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export const taskService = {
  async createTask(data: {
    title: string;
    description?: string;
    type: string;
    input?: any;
    priority?: number;
  }): Promise<Task> {
    const { data: task } = await api.post('/tasks', data);
    return task;
  },

  async getTasks(filters?: { status?: string; type?: string }): Promise<Task[]> {
    const { data } = await api.get('/tasks', { params: filters });
    return data.tasks;
  },

  async getTask(id: string): Promise<Task> {
    const { data } = await api.get(`/tasks/${id}`);
    return data;
  },

  async cancelTask(id: string): Promise<void> {
    await api.post(`/tasks/${id}/cancel`);
  },

  async retryTask(id: string): Promise<void> {
    await api.post(`/tasks/${id}/retry`);
  },
};
