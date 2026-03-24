import { FastifyInstance } from 'fastify';
import { authRoutes } from './auth.routes.js';
import { conversationRoutes } from './conversation.routes.js';
import { taskRoutes } from './task.routes.js';
import { workflowRoutes } from './workflow.routes.js';
import { analyticsRoutes } from './analytics.routes.js';

export async function registerRoutes(server: FastifyInstance) {
  // API prefix
  await server.register(
    async (api) => {
      await api.register(authRoutes, { prefix: '/auth' });
      await api.register(conversationRoutes, { prefix: '/conversations' });
      await api.register(taskRoutes, { prefix: '/tasks' });
      await api.register(workflowRoutes, { prefix: '/workflows' });
      await api.register(analyticsRoutes, { prefix: '/analytics' });
    },
    { prefix: '/api' }
  );
}
