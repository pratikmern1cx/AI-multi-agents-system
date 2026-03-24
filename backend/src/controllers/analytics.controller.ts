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

      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      const overview = await analyticsService.getAnalyticsOverview(userId, start, end);

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
      const end = endDate ? new Date(endDate) : new Date();

      const metrics = await analyticsService.getTaskMetrics(userId, start, end);

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
      const end = endDate ? new Date(endDate) : new Date();

      const usage = await analyticsService.getAgentUsage(userId, start, end);

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
      const end = endDate ? new Date(endDate) : new Date();

      const usage = await analyticsService.getToolUsage(userId, start, end);

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
      const end = endDate ? new Date(endDate) : new Date();

      const costs = await analyticsService.getCostTracking(userId, start, end);

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
      const end = endDate ? new Date(endDate) : new Date();

      const metrics = await analyticsService.getPerformanceMetrics(userId, start, end);

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
