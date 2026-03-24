import { FastifyRequest, FastifyReply } from 'fastify';
import { AnalyticsService } from '../services/analytics.service.js';
import { logger } from '../utils/logger.js';

const analyticsService = new AnalyticsService();

interface DateRangeQuery {
  startDate?: string;
  endDate?: string;
}

export const analyticsController = {
  async getOverview(
    request: FastifyRequest<{ Querystring: DateRangeQuery }>,
    reply: FastifyReply
  ) {
    try {
      const userId = (request.user as any).id;
      const { startDate, endDate } = request.query;

      const overview = await analyticsService.getDashboardAnalytics(userId, '30d');

      return reply.code(200).send({
        success: true,
        data: overview,
      });
    } catch (error: any) {
      logger.error('[AnalyticsController] Failed to get overview', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch analytics overview',
      });
    }
  },

  async getTaskMetrics(
    request: FastifyRequest<{ Querystring: DateRangeQuery }>,
    reply: FastifyReply
  ) {
    try {
      const userId = (request.user as any).id;
      const { startDate, endDate } = request.query;

      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const fullData = await analyticsService.getDashboardAnalytics(userId, '30d');
      const metrics = { 
        totalTasks: fullData.totalTasks, 
        completedTasks: fullData.completedTasks, 
        failedTasks: fullData.failedTasks, 
        averageExecutionTime: fullData.averageExecutionTime 
      };

      return reply.code(200).send({
        success: true,
        data: metrics,
      });
    } catch (error: any) {
      logger.error('[AnalyticsController] Failed to get task metrics', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch task metrics',
      });
    }
  },

  async getAgentUsage(
    request: FastifyRequest<{ Querystring: DateRangeQuery }>,
    reply: FastifyReply
  ) {
    try {
      const userId = (request.user as any).id;
      const { startDate, endDate } = request.query;

      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const fullData = await analyticsService.getDashboardAnalytics(userId, '30d');
      const usage = fullData.agentUsage;

      return reply.code(200).send({
        success: true,
        data: usage,
      });
    } catch (error: any) {
      logger.error('[AnalyticsController] Failed to get agent usage', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch agent usage',
      });
    }
  },

  async getToolUsage(
    request: FastifyRequest<{ Querystring: DateRangeQuery }>,
    reply: FastifyReply
  ) {
    try {
      const userId = (request.user as any).id;
      const { startDate, endDate } = request.query;

      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const fullData = await analyticsService.getDashboardAnalytics(userId, '30d');
      const usage = fullData.toolUsage;

      return reply.code(200).send({
        success: true,
        data: usage,
      });
    } catch (error: any) {
      logger.error('[AnalyticsController] Failed to get tool usage', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch tool usage',
      });
    }
  },

  async getCostTracking(
    request: FastifyRequest<{ Querystring: DateRangeQuery }>,
    reply: FastifyReply
  ) {
    try {
      const userId = (request.user as any).id;
      const { startDate, endDate } = request.query;

      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const fullData = await analyticsService.getDashboardAnalytics(userId, '30d');
      const costs = fullData.costMetrics;

      return reply.code(200).send({
        success: true,
        data: costs,
      });
    } catch (error: any) {
      logger.error('[AnalyticsController] Failed to get cost tracking', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch cost tracking',
      });
    }
  },

  async getPerformanceMetrics(
    request: FastifyRequest<{ Querystring: DateRangeQuery }>,
    reply: FastifyReply
  ) {
    try {
      const userId = (request.user as any).id;
      const { startDate, endDate } = request.query;

      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const fullData = await analyticsService.getDashboardAnalytics(userId, '30d');
      const metrics = fullData.performanceMetrics;

      return reply.code(200).send({
        success: true,
        data: metrics,
      });
    } catch (error: any) {
      logger.error('[AnalyticsController] Failed to get performance metrics', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch performance metrics',
      });
    }
  },
};
