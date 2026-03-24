import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { z } from 'zod';

const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.string(),
  input: z.any().optional(),
  priority: z.number().min(0).max(10).optional(),
});

const taskFiltersSchema = z.object({
  status: z.string().optional(),
  type: z.string().optional(),
});

export async function taskRoutes(server: FastifyInstance) {
  const taskService = (server as any).taskService;

  // All routes require authentication
  server.addHook('preHandler', authMiddleware);

  // Create task
  server.post(
    '/',
    {
      preHandler: [validateBody(createTaskSchema)],
    },
    async (request, reply) => {
      const userId = request.user!.userId;
      const task = await taskService.createTask(userId, request.body);
      return reply.status(201).send(task);
    }
  );

  // List tasks
  server.get('/', async (request, reply) => {
    const userId = request.user!.userId;
    const filters = request.query as any;
    const tasks = await taskService.listTasks(userId, filters);
    return reply.send({ tasks });
  });

  // Get task
  server.get('/:id', async (request, reply) => {
    const userId = request.user!.userId;
    const taskId = (request.params as any).id;
    const task = await taskService.getTask(taskId, userId);
    return reply.send(task);
  });

  // Cancel task
  server.post('/:id/cancel', async (request, reply) => {
    const userId = request.user!.userId;
    const taskId = (request.params as any).id;
    const result = await taskService.cancelTask(taskId, userId);
    return reply.send(result);
  });

  // Retry task
  server.post('/:id/retry', async (request, reply) => {
    const userId = request.user!.userId;
    const taskId = (request.params as any).id;
    const result = await taskService.retryTask(taskId, userId);
    return reply.send(result);
  });
}
