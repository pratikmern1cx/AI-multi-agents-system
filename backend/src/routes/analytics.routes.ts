import { FastifyInstance } from 'fastify';
import { analyticsController } from '../controllers/analytics.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

export async function analyticsRoutes(server: FastifyInstance) {
  // All analytics routes require authentication
  server.addHook('onRequest', authMiddleware);

  // GET /api/analytics/overview
  server.get('/overview', analyticsController.getOverview);

  // GET /api/analytics/tasks
  server.get('/tasks', analyticsController.getTaskMetrics);

  // GET /api/analytics/agents
  server.get('/agents', analyticsController.getAgentUsage);

  // GET /api/analytics/tools
  server.get('/tools', analyticsController.getToolUsage);

  // GET /api/analytics/costs
  server.get('/costs', analyticsController.getCostTracking);

  // GET /api/analytics/performance
  server.get('/performance', analyticsController.getPerformanceMetrics);
}
