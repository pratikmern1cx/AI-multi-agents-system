import { FastifyInstance } from 'fastify';
import { AuthController } from '../controllers/auth.controller.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { registerSchema, loginSchema } from '../schemas/auth.schema.js';

export async function authRoutes(server: FastifyInstance) {
  const controller = new AuthController();

  server.post(
    '/register',
    {
      preHandler: [validateBody(registerSchema)],
    },
    controller.register.bind(controller)
  );

  server.post(
    '/login',
    {
      preHandler: [validateBody(loginSchema)],
    },
    controller.login.bind(controller)
  );

  server.get(
    '/me',
    {
      preHandler: [authMiddleware],
    },
    controller.me.bind(controller)
  );
}
