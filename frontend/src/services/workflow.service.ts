import api from './api';

export interface Workflow {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  trigger_type: 'manual' | 'scheduled' | 'event' | 'webhook';
  trigger_config: any;
  steps: any[];
  is_active: boolean;
  last_run_at?: string;
  next_run_at?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  trigger_data: any;
  steps_completed: number;
  steps_total: number;
  output: any;
  error_message?: string;
  started_at: string;
  completed_at?: string;
}

export const workflowService = {
  async createWorkflow(data: {
    name: string;
    description?: string;
    triggerType: string;
    triggerConfig?: any;
    steps: any[];
  }): Promise<Workflow> {
    const { data: workflow } = await api.post('/workflows', data);
    return workflow;
  },

  async getWorkflows(filters?: {
    triggerType?: string;
    isActive?: boolean;
  }): Promise<Workflow[]> {
    const { data } = await api.get('/workflows', { params: filters });
    return data.workflows;
  },

  async getWorkflow(id: string): Promise<Workflow> {
    const { data } = await api.get(`/workflows/${id}`);
    return data;
  },

  async executeWorkflow(id: string, triggerData?: any): Promise<WorkflowExecution> {
    const { data } = await api.post(`/workflows/${id}/execute`, triggerData);
    return data;
  },

  async updateWorkflow(
    id: string,
    updates: {
      name?: string;
      description?: string;
      steps?: any[];
      isActive?: boolean;
      triggerConfig?: any;
    }
  ): Promise<void> {
    await api.patch(`/workflows/${id}`, updates);
  },

  async deleteWorkflow(id: string): Promise<void> {
    await api.delete(`/workflows/${id}`);
  },

  async getExecutions(id: string): Promise<WorkflowExecution[]> {
    const { data } = await api.get(`/workflows/${id}/executions`);
    return data.executions;
  },
};
