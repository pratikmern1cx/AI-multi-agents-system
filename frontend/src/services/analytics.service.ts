import api from './api';

export interface AnalyticsOverview {
  tasks: {
    total: number;
    completed: number;
    failed: number;
    pending: number;
    completionRate: number;
  };
  conversations: {
    total: number;
    avgMessagesPerConversation: number;
  };
  agents: {
    totalExecutions: number;
    mostUsedAgent: string;
  };
  tools: {
    totalCalls: number;
    mostUsedTool: string;
  };
  costs: {
    totalCost: number;
    avgCostPerTask: number;
  };
  performance: {
    avgTaskDuration: number;
    avgResponseTime: number;
  };
}

export interface TaskMetrics {
  total: number;
  completed: number;
  failed: number;
  pending: number;
  running: number;
  completionRate: number;
  avgDuration: number;
  tasksByStatus: Array<{ status: string; count: number }>;
  tasksByPriority: Array<{ priority: string; count: number }>;
}

export interface AgentUsage {
  totalExecutions: number;
  agentStats: Array<{
    agentType: string;
    executionCount: number;
    avgDuration: number;
    successRate: number;
  }>;
}

export interface ToolUsage {
  totalCalls: number;
  toolStats: Array<{
    toolName: string;
    callCount: number;
    successRate: number;
    avgDuration: number;
  }>;
}

export interface CostTracking {
  totalCost: number;
  avgCostPerTask: number;
  costByAgent: Array<{
    agentType: string;
    totalCost: number;
  }>;
  costByTool: Array<{
    toolName: string;
    totalCost: number;
  }>;
}

export interface PerformanceMetrics {
  avgTaskDuration: number;
  avgResponseTime: number;
  p95TaskDuration: number;
  p99TaskDuration: number;
  throughput: number;
}

export const analyticsService = {
  async getOverview(startDate?: Date, endDate?: Date): Promise<AnalyticsOverview> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate.toISOString());
    if (endDate) params.append('endDate', endDate.toISOString());

    const response = await api.get(`/analytics/overview?${params.toString()}`);
    return response.data.data;
  },

  async getTaskMetrics(startDate?: Date, endDate?: Date): Promise<TaskMetrics> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate.toISOString());
    if (endDate) params.append('endDate', endDate.toISOString());

    const response = await api.get(`/analytics/tasks?${params.toString()}`);
    return response.data.data;
  },

  async getAgentUsage(startDate?: Date, endDate?: Date): Promise<AgentUsage> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate.toISOString());
    if (endDate) params.append('endDate', endDate.toISOString());

    const response = await api.get(`/analytics/agents?${params.toString()}`);
    return response.data.data;
  },

  async getToolUsage(startDate?: Date, endDate?: Date): Promise<ToolUsage> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate.toISOString());
    if (endDate) params.append('endDate', endDate.toISOString());

    const response = await api.get(`/analytics/tools?${params.toString()}`);
    return response.data.data;
  },

  async getCostTracking(startDate?: Date, endDate?: Date): Promise<CostTracking> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate.toISOString());
    if (endDate) params.append('endDate', endDate.toISOString());

    const response = await api.get(`/analytics/costs?${params.toString()}`);
    return response.data.data;
  },

  async getPerformanceMetrics(startDate?: Date, endDate?: Date): Promise<PerformanceMetrics> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate.toISOString());
    if (endDate) params.append('endDate', endDate.toISOString());

    const response = await api.get(`/analytics/performance?${params.toString()}`);
    return response.data.data;
  },
};
