import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { z } from 'zod';

const createWorkflowSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  triggerType: z.enum(['manual', 'scheduled', 'event', 'webhook']),
  triggerConfig: z.any().optional(),
  steps: z.array(z.any()),
});

const updateWorkflowSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  steps: z.array(z.any()).optional(),
  isActive: z.boolean().optional(),
  triggerConfig: z.any().optional(),
});

export async function workflowRoutes(server: FastifyInstance) {
  const workflowService = (server as any).workflowService;

  // All routes require authentication
  server.addHook('preHandler', authMiddleware);

  // Create workflow
  server.post(
    '/',
    {
      preHandler: [validateBody(createWorkflowSchema)],
    },
    async (request, reply) => {
      const userId = request.user!.userId;
      const workflow = await workflowService.createWorkflow(userId, request.body);
      return reply.status(201).send(workflow);
    }
  );

  // List workflows
  server.get('/', async (request, reply) => {
    const userId = request.user!.userId;
    const filters = request.query as any;
    const workflows = await workflowService.listWorkflows(userId, filters);
    return reply.send({ workflows });
  });

  // Get workflow
  server.get('/:id', async (request, reply) => {
    const userId = request.user!.userId;
    const workflowId = (request.params as any).id;
    const workflow = await workflowService.getWorkflow(workflowId, userId);
    return reply.send(workflow);
  });

  // Execute workflow
  server.post('/:id/execute', async (request, reply) => {
    const userId = request.user!.userId;
    const workflowId = (request.params as any).id;
    const triggerData = request.body;
    const execution = await workflowService.executeWorkflow(workflowId, userId, triggerData);
    return reply.send(execution);
  });

  // Update workflow
  server.patch(
    '/:id',
    {
      preHandler: [validateBody(updateWorkflowSchema)],
    },
    async (request, reply) => {
      const userId = request.user!.userId;
      const workflowId = (request.params as any).id;
      const result = await workflowService.updateWorkflow(workflowId, userId, request.body);
      return reply.send(result);
    }
  );

  // Delete workflow
  server.delete('/:id', async (request, reply) => {
    const userId = request.user!.userId;
    const workflowId = (request.params as any).id;
    const result = await workflowService.deleteWorkflow(workflowId, userId);
    return reply.send(result);
  });

  // Get workflow executions
  server.get('/:id/executions', async (request, reply) => {
    const userId = request.user!.userId;
    const workflowId = (request.params as any).id;
    const executions = await workflowService.getWorkflowExecutions(workflowId, userId);
    return reply.send({ executions });
  });
}
