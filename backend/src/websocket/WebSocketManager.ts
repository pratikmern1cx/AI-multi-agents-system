import { FastifyInstance } from 'fastify';
import { WebSocket } from 'ws';
import { logger } from '../utils/logger.js';
import { AuthService } from '../services/auth.service.js';

export interface WebSocketClient {
  ws: WebSocket;
  userId: string;
  conversationId?: string;
}

export class WebSocketManager {
  private clients: Map<string, WebSocketClient> = new Map();
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  async initialize(server: FastifyInstance) {
    server.get('/ws', { websocket: true }, (connection: any, req) => {
      this.handleConnection(connection.socket || connection, req);
    });

    logger.info('[WebSocketManager] WebSocket server initialized');
  }

  private async handleConnection(ws: WebSocket, req: any) {
    const clientId = this.generateClientId();

    logger.info('[WebSocketManager] New connection', { clientId });

    // Wait for authentication message
    ws.on('message', async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());

        if (message.type === 'auth') {
          await this.authenticateClient(ws, clientId, message.token, message.conversationId);
        } else {
          const client = this.clients.get(clientId);
          if (client) {
            await this.handleMessage(client, message);
          } else {
            this.sendError(ws, 'Not authenticated');
          }
        }
      } catch (error: any) {
        logger.error('[WebSocketManager] Message handling error', error);
        this.sendError(ws, error.message);
      }
    });

    ws.on('close', () => {
      this.handleDisconnection(clientId);
    });

    ws.on('error', (error) => {
      logger.error('[WebSocketManager] WebSocket error', error);
      this.handleDisconnection(clientId);
    });
  }

  private async authenticateClient(
    ws: WebSocket,
    clientId: string,
    token: string,
    conversationId?: string
  ) {
    try {
      const user = this.authService.verifyToken(token);

      this.clients.set(clientId, {
        ws,
        userId: user.userId,
        conversationId,
      });

      this.send(ws, {
        type: 'auth_success',
        clientId,
        userId: user.userId,
      });

      logger.info('[WebSocketManager] Client authenticated', {
        clientId,
        userId: user.userId,
      });
    } catch (error: any) {
      this.sendError(ws, 'Authentication failed');
      ws.close();
    }
  }

  private async handleMessage(client: WebSocketClient, message: any) {
    logger.info('[WebSocketManager] Received message', {
      userId: client.userId,
      type: message.type,
    });

    switch (message.type) {
      case 'ping':
        this.send(client.ws, { type: 'pong' });
        break;

      case 'subscribe':
        client.conversationId = message.conversationId;
        this.send(client.ws, {
          type: 'subscribed',
          conversationId: message.conversationId,
        });
        break;

      case 'unsubscribe':
        client.conversationId = undefined;
        this.send(client.ws, { type: 'unsubscribed' });
        break;

      default:
        this.sendError(client.ws, `Unknown message type: ${message.type}`);
    }
  }

  private handleDisconnection(clientId: string) {
    const client = this.clients.get(clientId);
    if (client) {
      logger.info('[WebSocketManager] Client disconnected', {
        clientId,
        userId: client.userId,
      });
      this.clients.delete(clientId);
    }
  }

  // Public methods for broadcasting events

  broadcastToUser(userId: string, message: any) {
    let count = 0;
    for (const [_, client] of this.clients) {
      if (client.userId === userId) {
        this.send(client.ws, message);
        count++;
      }
    }
    logger.debug(`[WebSocketManager] Broadcast to user ${userId}`, { count });
  }

  broadcastToConversation(conversationId: string, message: any) {
    let count = 0;
    for (const [_, client] of this.clients) {
      if (client.conversationId === conversationId) {
        this.send(client.ws, message);
        count++;
      }
    }
    logger.debug(`[WebSocketManager] Broadcast to conversation ${conversationId}`, { count });
  }

  broadcastTaskUpdate(userId: string, taskId: string, status: string, data?: any) {
    this.broadcastToUser(userId, {
      type: 'task_update',
      taskId,
      status,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  broadcastAgentStatus(userId: string, agentName: string, status: string, message?: string) {
    this.broadcastToUser(userId, {
      type: 'agent_status',
      agentName,
      status,
      message,
      timestamp: new Date().toISOString(),
    });
  }

  broadcastMessageUpdate(conversationId: string, message: any) {
    this.broadcastToConversation(conversationId, {
      type: 'message_update',
      message,
      timestamp: new Date().toISOString(),
    });
  }

  broadcastWorkflowUpdate(userId: string, workflowId: string, executionId: string, data: any) {
    this.broadcastToUser(userId, {
      type: 'workflow_update',
      workflowId,
      executionId,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  // Helper methods

  private send(ws: WebSocket, message: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private sendError(ws: WebSocket, error: string) {
    this.send(ws, {
      type: 'error',
      error,
      timestamp: new Date().toISOString(),
    });
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getConnectedClients(): number {
    return this.clients.size;
  }

  getClientsByUser(userId: string): number {
    let count = 0;
    for (const [_, client] of this.clients) {
      if (client.userId === userId) {
        count++;
      }
    }
    return count;
  }
}
