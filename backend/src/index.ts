import { buildServer } from './server.js';
import { connectRedis, disconnectRedis } from './config/redis.js';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { AgentRegistry } from './agents/registry/AgentRegistry.js';
import { MemoryManager } from './memory/MemoryManager.js';
import { Orchestrator } from './agents/orchestrator/Orchestrator.js';
import { ConversationService } from './services/conversation.service.js';
import { TaskService } from './services/task.service.js';
import { WorkflowService } from './services/workflow.service.js';
import { PlannerAgent } from './agents/implementations/PlannerAgent.js';
import { ResearchAgent } from './agents/implementations/ResearchAgent.js';
import { ExecutionAgent } from './agents/implementations/ExecutionAgent.js';
import { ReviewAgent } from './agents/implementations/ReviewAgent.js';
import { QueueManager } from './queue/QueueManager.js';
import { TaskWorker } from './queue/workers/TaskWorker.js';
import { WorkflowWorker } from './queue/workers/WorkflowWorker.js';
import { AutomationWorker } from './queue/workers/AutomationWorker.js';
import { ToolRegistry } from './tools/registry/ToolRegistry.js';
import { WebSocketManager } from './websocket/WebSocketManager.js';

async function start() {
  try {
    // Connect to Redis
    await connectRedis();
    logger.info('Redis connected');

    // Initialize queue system
    const queueManager = new QueueManager();
    logger.info('Queue manager initialized');

    // Initialize tool registry
    const toolRegistry = new ToolRegistry();
    logger.info('Tool registry initialized');

    // Initialize agent system
    const agentRegistry = new AgentRegistry();
    const memoryManager = new MemoryManager();
    const orchestrator = new Orchestrator(agentRegistry, memoryManager);

    // Register default agents with tools
    const plannerAgent = new PlannerAgent();
    const researchAgent = new ResearchAgent();
    const executionAgent = new ExecutionAgent();
    const reviewAgent = new ReviewAgent();

    // Add tools to agents
    const allTools = toolRegistry.getAllTools();
    allTools.forEach(tool => {
      executionAgent.addTool(tool);
      researchAgent.addTool(tool);
    });

    agentRegistry.register(plannerAgent);
    agentRegistry.register(researchAgent);
    agentRegistry.register(executionAgent);
    agentRegistry.register(reviewAgent);

    logger.info('Agents registered with tools');

    // Initialize services
    const conversationService = new ConversationService(orchestrator);
    const taskService = new TaskService(queueManager);
    const workflowService = new WorkflowService(queueManager);

    // Initialize WebSocket manager
    const wsManager = new WebSocketManager();

    // Register queue workers
    const taskWorker = new TaskWorker(orchestrator);
    queueManager.registerWorker('taskQueue', taskWorker.process.bind(taskWorker), 5);

    const workflowWorker = new WorkflowWorker(queueManager);
    queueManager.registerWorker('workflowQueue', workflowWorker.process.bind(workflowWorker), 3);

    const automationWorker = new AutomationWorker(queueManager);
    queueManager.registerWorker('automationQueue', automationWorker.process.bind(automationWorker), 2);

    logger.info('Queue workers registered');

    // Build and start server
    const server = await buildServer();

    // Make services available to routes
    server.decorate('orchestrator', orchestrator);
    server.decorate('agentRegistry', agentRegistry);
    server.decorate('conversationService', conversationService);
    server.decorate('taskService', taskService);
    server.decorate('workflowService', workflowService);
    server.decorate('toolRegistry', toolRegistry);
    server.decorate('queueManager', queueManager);
    server.decorate('wsManager', wsManager);

    // Initialize WebSocket
    await wsManager.initialize(server);

    await server.listen({
      port: config.port,
      host: config.host,
    });

    logger.info(`Server listening on ${config.host}:${config.port}`);
    logger.info('✅ All systems operational');
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown() {
  logger.info('Shutting down gracefully...');
  
  try {
    const queueManager = (global as any).queueManager;
    if (queueManager) {
      await queueManager.closeAll();
    }
    await disconnectRedis();
    logger.info('Shutdown complete');
  } catch (error) {
    logger.error('Error during shutdown', error);
  }
  
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

start();
