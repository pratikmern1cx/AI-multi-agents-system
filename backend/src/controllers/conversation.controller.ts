import { FastifyRequest, FastifyReply } from 'fastify';
import { ConversationService } from '../services/conversation.service.js';
import { CreateConversationInput, SendMessageInput } from '../schemas/conversation.schema.js';

export class ConversationController {
  private conversationService: ConversationService;

  constructor(conversationService: ConversationService) {
    this.conversationService = conversationService;
  }

  async create(
    request: FastifyRequest<{ Body: CreateConversationInput }>,
    reply: FastifyReply
  ) {
    const userId = request.user!.userId;
    const { title } = request.body;
    
    const conversation = await this.conversationService.createConversation(userId, title);
    
    return reply.status(201).send(conversation);
  }

  async list(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.userId;
    const conversations = await this.conversationService.getConversations(userId);
    
    return reply.send({ conversations });
  }

  async get(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const userId = request.user!.userId;
    const conversationId = request.params.id;
    
    const conversation = await this.conversationService.getConversation(
      conversationId,
      userId
    );
    
    return reply.send(conversation);
  }

  async sendMessage(
    request: FastifyRequest<{
      Params: { id: string };
      Body: SendMessageInput;
    }>,
    reply: FastifyReply
  ) {
    const userId = request.user!.userId;
    const conversationId = request.params.id;
    const { content } = request.body;
    
    const result = await this.conversationService.sendMessage(
      conversationId,
      userId,
      content
    );
    
    return reply.send(result);
  }

  async delete(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const userId = request.user!.userId;
    const conversationId = request.params.id;
    
    const result = await this.conversationService.deleteConversation(
      conversationId,
      userId
    );
    
    return reply.send(result);
  }
}
