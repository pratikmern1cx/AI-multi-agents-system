import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../services/auth.service.js';
import { RegisterInput, LoginInput } from '../schemas/auth.schema.js';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  async register(
    request: FastifyRequest<{ Body: RegisterInput }>,
    reply: FastifyReply
  ) {
    const { email, password, fullName } = request.body;
    const result = await this.authService.register(email, password, fullName);
    
    return reply.status(201).send(result);
  }

  async login(
    request: FastifyRequest<{ Body: LoginInput }>,
    reply: FastifyReply
  ) {
    const { email, password } = request.body;
    const result = await this.authService.login(email, password);
    
    return reply.send(result);
  }

  async me(request: FastifyRequest, reply: FastifyReply) {
    return reply.send({ user: request.user });
  }
}
