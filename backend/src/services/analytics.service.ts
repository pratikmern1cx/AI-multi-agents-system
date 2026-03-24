import { supabase } from '../config/database.js';
import { redis } from '../config/redis.js';
import { logger } from '../utils/logger.js';

export interface AnalyticsData {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageExecutionTime: number;
  totalConversations: number;
  totalMessages: number;
  agentUsage: Record<string, number>;
  toolUsage: Record<string, number>;
  costMetrics: {
    totalTokens: number;
    estimatedCost: number;
    costByAgent: Record<string, number>;
  };
  performanceMetrics: {
    avgResponseTime: number;
    successRate: number;
    errorRate: number;
  };
}

export class AnalyticsService {
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly CACHE_KEY = 'analytics:dashboard';

  async getDashboardAnalytics(userId: string, timeRange: string = '7d'): Promise<AnalyticsData> {
    // Try cache first
    const cached = await this.getCachedAnalytics(userId);
    if (cached) {
      return cached;
    }

    const startDate = this.getStartDate(timeRange);

    // Fetch all metrics in parallel
    const [
      taskMetrics,
      conversationMetrics,
      agentMetrics,
      toolMetrics,
      costMetrics,
      performanceMetrics,
    ] = await Promise.all([
      this.getTaskMetrics(userId, startDate),
      this.getConversationMetrics(userId, startDate),
      this.getAgentUsageMetrics(userId, startDate),
      this.getToolUsageMetrics(userId, startDate),
      this.getCostMetrics(userId, startDate),
      this.getPerformanceMetrics(userId, startDate),
    ]);

    const analytics: AnalyticsData = {
      ...taskMetrics,
      ...conversationMetrics,
      agentUsage: agentMetrics,
      toolUsage: toolMetrics,
      costMetrics,
      performanceMetrics,
    };

    // Cache the result
    await this.cacheAnalytics(userId, analytics);

    return analytics;
  }

  private async getTaskMetrics(userId: string, startDate: Date) {
    const { data: tasks } = await supabase
      .from('tasks')
      .select('status, created_at, started_at, completed_at')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString());

    const totalTasks = tasks?.length || 0;
    const completedTasks = tasks?.filter((t) => t.status === 'completed').length || 0;
    const failedTasks = tasks?.filter((t) => t.status === 'failed').length || 0;

    // Calculate average execution time
    const executionTimes = tasks
      ?.filter((t) => t.started_at && t.completed_at)
      .map((t) => {
        const start = new Date(t.started_at).getTime();
        const end = new Date(t.completed_at).getTime();
        return end - start;
      }) || [];

    const averageExecutionTime =
      executionTimes.length > 0
        ? executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length
        : 0;

    return {
      totalTasks,
      completedTasks,
      failedTasks,
      averageExecutionTime: Math.round(averageExecutionTime / 1000), // Convert to seconds
    };
  }

  private async getConversationMetrics(userId: string, startDate: Date) {
    const { data: conversations } = await supabase
      .from('conversations')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString());

    const { data: messages } = await supabase
      .from('messages')
      .select('conversation_id')
      .in(
        'conversation_id',
        conversations?.map((c) => c.id) || []
      );

    return {
      totalConversations: conversations?.length || 0,
      totalMessages: messages?.length || 0,
    };
  }

  private async getAgentUsageMetrics(userId: string, startDate: Date) {
    const { data: logs } = await supabase
      .from('logs')
      .select('context')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .like('message', '%Agent%executed%');

    const agentUsage: Record<string, number> = {};

    logs?.forEach((log) => {
      const agentName = log.context?.agentName;
      if (agentName) {
        agentUsage[agentName] = (agentUsage[agentName] || 0) + 1;
      }
    });

    return agentUsage;
  }

  private async getToolUsageMetrics(userId: string, startDate: Date) {
    const { data: logs } = await supabase
      .from('logs')
      .select('context')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .like('message', '%Tool%executed%');

    const toolUsage: Record<string, number> = {};

    logs?.forEach((log) => {
      const toolName = log.context?.toolName;
      if (toolName) {
        toolUsage[toolName] = (toolUsage[toolName] || 0) + 1;
      }
    });

    return toolUsage;
  }

  private async getCostMetrics(userId: string, startDate: Date) {
    const { data: messages } = await supabase
      .from('messages')
      .select('metadata')
      .eq('role', 'assistant')
      .gte('created_at', startDate.toISOString());

    let totalTokens = 0;
    const costByAgent: Record<string, number> = {};

    messages?.forEach((msg) => {
      const tokens = msg.metadata?.tokensUsed || 0;
      const agentName = msg.metadata?.agentName || 'unknown';

      totalTokens += tokens;

      if (!costByAgent[agentName]) {
        costByAgent[agentName] = 0;
      }
      costByAgent[agentName] += tokens;
    });

    // Estimate cost (GPT-4 pricing: ~$0.03 per 1K tokens)
    const estimatedCost = (totalTokens / 1000) * 0.03;

    return {
      totalTokens,
      estimatedCost: Math.round(estimatedCost * 100) / 100,
      costByAgent,
    };
  }

  private async getPerformanceMetrics(userId: string, startDate: Date) {
    const { data: tasks } = await supabase
      .from('tasks')
      .select('status, started_at, completed_at')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString());

    const totalTasks = tasks?.length || 0;
    const completedTasks = tasks?.filter((t) => t.status === 'completed').length || 0;
    const failedTasks = tasks?.filter((t) => t.status === 'failed').length || 0;

    const responseTimes = tasks
      ?.filter((t) => t.started_at && t.completed_at)
      .map((t) => {
        const start = new Date(t.started_at).getTime();
        const end = new Date(t.completed_at).getTime();
        return end - start;
      }) || [];

    const avgResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0;

    const successRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const errorRate = totalTasks > 0 ? (failedTasks / totalTasks) * 100 : 0;

    return {
      avgResponseTime: Math.round(avgResponseTime / 1000), // Convert to seconds
      successRate: Math.round(successRate * 10) / 10,
      errorRate: Math.round(errorRate * 10) / 10,
    };
  }

  private getStartDate(timeRange: string): Date {
    const now = new Date();
    switch (timeRange) {
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
  }

  private async getCachedAnalytics(userId: string): Promise<AnalyticsData | null> {
    try {
      const cached = await redis.get(`${this.CACHE_KEY}:${userId}`);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      logger.error('[AnalyticsService] Cache read failed', error);
      return null;
    }
  }

  private async cacheAnalytics(userId: string, data: AnalyticsData): Promise<void> {
    try {
      await redis.setEx(
        `${this.CACHE_KEY}:${userId}`,
        this.CACHE_TTL,
        JSON.stringify(data)
      );
    } catch (error) {
      logger.error('[AnalyticsService] Cache write failed', error);
    }
  }

  async getAgentPerformance(userId: string, timeRange: string = '7d') {
    const startDate = this.getStartDate(timeRange);

    const { data: logs } = await supabase
      .from('logs')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .like('message', '%Agent%');

    const agentStats: Record<
      string,
      {
        executions: number;
        avgTime: number;
        successRate: number;
        errors: number;
      }
    > = {};

    logs?.forEach((log) => {
      const agentName = log.context?.agentName;
      if (!agentName) return;

      if (!agentStats[agentName]) {
        agentStats[agentName] = {
          executions: 0,
          avgTime: 0,
          successRate: 0,
          errors: 0,
        };
      }

      agentStats[agentName].executions++;

      if (log.level === 'error') {
        agentStats[agentName].errors++;
      }

      if (log.context?.executionTime) {
        agentStats[agentName].avgTime += log.context.executionTime;
      }
    });

    // Calculate averages
    Object.keys(agentStats).forEach((agent) => {
      const stats = agentStats[agent];
      stats.avgTime = Math.round(stats.avgTime / stats.executions);
      stats.successRate =
        Math.round(((stats.executions - stats.errors) / stats.executions) * 1000) / 10;
    });

    return agentStats;
  }

  async invalidateCache(userId: string): Promise<void> {
    try {
      await redis.del(`${this.CACHE_KEY}:${userId}`);
    } catch (error) {
      logger.error('[AnalyticsService] Cache invalidation failed', error);
    }
  }
}
