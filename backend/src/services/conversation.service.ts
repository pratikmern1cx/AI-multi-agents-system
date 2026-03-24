import { v4 as uuidv4 } from 'uuid';
import { ConversationRepository } from '../repositories/conversation.repository.js';
import { MessageRepository } from '../repositories/message.repository.js';
import { Orchestrator } from '../agents/orchestrator/Orchestrator.js';
import { AgentContext } from '../types/agent.types.js';
import { NotFoundError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export class ConversationService {
  private conversationRepo: ConversationRepository;
  private messageRepo: MessageRepository;
  private orchestrator: Orchestrator;

  constructor(orchestrator: Orchestrator) {
    this.conversationRepo = new ConversationRepository();
    this.messageRepo = new MessageRepository();
    this.orchestrator = orchestrator;
  }

  async createConversation(userId: string, title?: string) {
    const conversation = await this.conversationRepo.create({
      user_id: userId,
      title: title || 'New Conversation',
      status: 'active',
      context: {},
    });

    logger.info('[ConversationService] Conversation created', {
      conversationId: conversation?.id,
      userId,
    });

    return conversation;
  }

  async getConversations(userId: string) {
    return this.conversationRepo.findByUserId(userId);
  }

  async getConversation(conversationId: string, userId: string) {
    const conversation = await this.conversationRepo.findById(conversationId);
    
    if (!conversation || conversation.user_id !== userId) {
      throw new NotFoundError('Conversation not found');
    }

    const messages = await this.messageRepo.findByConversationId(conversationId);

    return {
      ...conversation,
      messages,
    };
  }

  async sendMessage(conversationId: string, userId: string, content: string) {
    // Verify conversation exists and belongs to user
    const conversation = await this.conversationRepo.findById(conversationId);
    if (!conversation || conversation.user_id !== userId) {
      throw new NotFoundError('Conversation not found');
    }

    // Save user message
    const userMessage = await this.messageRepo.create({
      conversation_id: conversationId,
      role: 'user',
      content,
      metadata: {},
    });

    logger.info('[ConversationService] User message saved', {
      conversationId,
      messageId: userMessage?.id,
    });

    // Process with orchestrator
    const context: AgentContext = {
      conversationId,
      userId,
      sessionMemory: new Map(),
    };

    const result = await this.orchestrator.processRequest(content, context);

    // Save assistant response
    const assistantMessage = await this.messageRepo.create({
      conversation_id: conversationId,
      role: 'assistant',
      content: result.result || 'I encountered an error processing your request.',
      metadata: {
        intent: result.intent,
        tasks: result.tasks,
        success: result.success,
      },
    });

    logger.info('[ConversationService] Assistant message saved', {
      conversationId,
      messageId: assistantMessage?.id,
    });

    // Update conversation timestamp
    await this.conversationRepo.update(conversationId, {
      updated_at: new Date(),
    } as any);

    return {
      userMessage,
      assistantMessage,
      metadata: {
        intent: result.intent,
        tasks: result.tasks,
      },
    };
  }

  async deleteConversation(conversationId: string, userId: string) {
    const conversation = await this.conversationRepo.findById(conversationId);
    
    if (!conversation || conversation.user_id !== userId) {
      throw new NotFoundError('Conversation not found');
    }

    await this.conversationRepo.update(conversationId, {
      status: 'deleted',
    } as any);

    logger.info('[ConversationService] Conversation deleted', { conversationId });

    return { success: true };
  }
}
