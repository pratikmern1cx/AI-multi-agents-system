import { FastifyInstance } from 'fastify';
import { ConversationController } from '../controllers/conversation.controller.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { createConversationSchema, sendMessageSchema } from '../schemas/conversation.schema.js';

export async function conversationRoutes(server: FastifyInstance) {
  // All routes require authentication
  server.addHook('preHandler', authMiddleware);

  server.post(
    '/',
    {
      preHandler: [validateBody(createConversationSchema)],
    },
    async (request: any, reply: any) => {
      const conversationService = (server as any).conversationService;
      const controller = new ConversationController(conversationService);
      return controller.create(request, reply);
    }
  );

  server.get('/', async (request: any, reply: any) => {
    const conversationService = (server as any).conversationService;
    const controller = new ConversationController(conversationService);
    return controller.list(request, reply);
  });

  server.get('/:id', async (request: any, reply: any) => {
    const conversationService = (server as any).conversationService;
    const controller = new ConversationController(conversationService);
    return controller.get(request, reply);
  });

  server.post(
    '/:id/messages',
    {
      preHandler: [validateBody(sendMessageSchema)],
    },
    async (request: any, reply: any) => {
      const conversationService = (server as any).conversationService;
      const controller = new ConversationController(conversationService);
      return controller.sendMessage(request, reply);
    }
  );

  server.delete('/:id', async (request: any, reply: any) => {
    const conversationService = (server as any).conversationService;
    const controller = new ConversationController(conversationService);
    return controller.delete(request, reply);
  });
}
