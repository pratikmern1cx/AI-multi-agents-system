# Multi-Agent AI Platform - Folder Structure

## Backend Structure

```
backend/
├── src/
│   ├── index.ts                    # Application entry point
│   ├── server.ts                   # Fastify server setup
│   │
│   ├── config/                     # Configuration
│   │   ├── index.ts               # Config loader
│   │   ├── database.ts            # Supabase config
│   │   ├── redis.ts               # Redis config
│   │   └── openai.ts              # OpenAI config
│   │
│   ├── controllers/                # HTTP request handlers
│   │   ├── auth.controller.ts
│   │   ├── conversation.controller.ts
│   │   ├── task.controller.ts
│   │   ├── workflow.controller.ts
│   │   ├── agent.controller.ts
│   │   └── websocket.controller.ts
│   │
│   ├── services/                   # Business logic
│   │   ├── auth.service.ts
│   │   ├── conversation.service.ts
│   │   ├── task.service.ts
│   │   ├── workflow.service.ts
│   │   └── memory.service.ts
│   │
│   ├── agents/                     # Agent system
│   │   ├── base/
│   │   │   ├── BaseAgent.ts       # Abstract agent class
│   │   │   └── AgentInterface.ts  # Agent contract
│   │   │
│   │   ├── orchestrator/
│   │   │   ├── Orchestrator.ts    # Central orchestrator
│   │   │   ├── IntentDetector.ts  # Intent classification
│   │   │   ├── TaskPlanner.ts     # Task decomposition
│   │   │   └── ResultAggregator.ts
│   │   │
│   │   ├── implementations/
│   │   │   ├── PlannerAgent.ts
│   │   │   ├── ResearchAgent.ts
│   │   │   ├── ExecutionAgent.ts
│   │   │   └── ReviewAgent.ts
│   │   │
│   │   ├── communication/
│   │   │   ├── AgentBus.ts        # Inter-agent messaging
│   │   │   └── MessageQueue.ts
│   │   │
│   │   └── registry/
│   │       └── AgentRegistry.ts   # Agent discovery
│   │
│   ├── ai/                         # AI/LLM layer
│   │   ├── llm/
│   │   │   ├── OpenAIClient.ts    # OpenAI wrapper
│   │   │   └── PromptManager.ts   # Prompt templates
│   │   │
│   │   ├── embeddings/
│   │   │   └── EmbeddingService.ts
│   │   │
│   │   └── function-calling/
│   │       ├── FunctionRegistry.ts
│   │       └── FunctionExecutor.ts
│   │
│   ├── tools/                      # Tool execution
│   │   ├── base/
│   │   │   └── BaseTool.ts
│   │   │
│   │   ├── implementations/
│   │   │   ├── EmailTool.ts
│   │   │   ├── CalendarTool.ts
│   │   │   ├── WebScraperTool.ts
│   │   │   └── CustomAPITool.ts
│   │   │
│   │   └── registry/
│   │       └── ToolRegistry.ts
│   │
│   ├── memory/                     # Memory system
│   │   ├── ShortTermMemory.ts     # Redis-based
│   │   ├── LongTermMemory.ts      # Supabase-based
│   │   ├── MemoryManager.ts       # Hybrid coordinator
│   │   └── RAGService.ts          # Retrieval-augmented generation
│   │
│   ├── queue/                      # Job processing
│   │   ├── QueueManager.ts        # BullMQ setup
│   │   ├── workers/
│   │   │   ├── TaskWorker.ts
│   │   │   ├── WorkflowWorker.ts
│   │   │   └── AutomationWorker.ts
│   │   │
│   │   └── jobs/
│   │       ├── TaskJob.ts
│   │       └── WorkflowJob.ts
│   │
│   ├── repositories/               # Data access layer
│   │   ├── base/
│   │   │   └── BaseRepository.ts
│   │   │
│   │   ├── user.repository.ts
│   │   ├── conversation.repository.ts
│   │   ├── message.repository.ts
│   │   ├── task.repository.ts
│   │   ├── workflow.repository.ts
│   │   ├── agent.repository.ts
│   │   └── memory.repository.ts
│   │
│   ├── middleware/                 # Express/Fastify middleware
│   │   ├── auth.middleware.ts
│   │   ├── validation.middleware.ts
│   │   ├── error.middleware.ts
│   │   ├── rateLimit.middleware.ts
│   │   └── logging.middleware.ts
│   │
│   ├── routes/                     # API routes
│   │   ├── index.ts               # Route aggregator
│   │   ├── auth.routes.ts
│   │   ├── conversation.routes.ts
│   │   ├── task.routes.ts
│   │   ├── workflow.routes.ts
│   │   ├── agent.routes.ts
│   │   └── websocket.routes.ts
│   │
│   ├── schemas/                    # Zod validation schemas
│   │   ├── auth.schema.ts
│   │   ├── conversation.schema.ts
│   │   ├── task.schema.ts
│   │   └── workflow.schema.ts
│   │
│   ├── types/                      # TypeScript types
│   │   ├── agent.types.ts
│   │   ├── task.types.ts
│   │   ├── workflow.types.ts
│   │   └── common.types.ts
│   │
│   └── utils/                      # Utilities
│       ├── logger.ts              # Pino logger
│       ├── errors.ts              # Custom error classes
│       ├── crypto.ts              # Encryption helpers
│       └── validators.ts
│
├── scripts/                        # Utility scripts
│   ├── migrate.js                 # DB migration runner
│   └── seed.js                    # Seed data
│
├── tests/                          # Tests
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## Frontend Structure

```
frontend/
├── src/
│   ├── main.tsx                   # App entry point
│   ├── App.tsx                    # Root component
│   │
│   ├── pages/                     # Page components
│   │   ├── ChatPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── AgentManagerPage.tsx
│   │   ├── WorkflowsPage.tsx
│   │   └── LogsPage.tsx
│   │
│   ├── components/                # Reusable components
│   │   ├── chat/
│   │   │   ├── ChatInterface.tsx
│   │   │   ├── MessageList.tsx
│   │   │   ├── MessageInput.tsx
│   │   │   └── TypingIndicator.tsx
│   │   │
│   │   ├── dashboard/
│   │   │   ├── TaskCard.tsx
│   │   │   ├── WorkflowCard.tsx
│   │   │   └── StatsWidget.tsx
│   │   │
│   │   ├── agents/
│   │   │   ├── AgentCard.tsx
│   │   │   └── AgentConfig.tsx
│   │   │
│   │   └── common/
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Modal.tsx
│   │       └── Loader.tsx
│   │
│   ├── hooks/                     # Custom React hooks
│   │   ├── useWebSocket.ts
│   │   ├── useChat.ts
│   │   ├── useTasks.ts
│   │   └── useAuth.ts
│   │
│   ├── services/                  # API clients
│   │   ├── api.ts                # Axios instance
│   │   ├── auth.service.ts
│   │   ├── chat.service.ts
│   │   ├── task.service.ts
│   │   └── websocket.service.ts
│   │
│   ├── store/                     # State management (Zustand/Redux)
│   │   ├── authStore.ts
│   │   ├── chatStore.ts
│   │   └── taskStore.ts
│   │
│   ├── types/                     # TypeScript types
│   │   ├── chat.types.ts
│   │   ├── task.types.ts
│   │   └── agent.types.ts
│   │
│   ├── utils/                     # Utilities
│   │   ├── formatters.ts
│   │   └── validators.ts
│   │
│   └── styles/                    # Global styles
│       └── index.css
│
├── public/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Root Structure

```
multi-agent-ai-platform/
├── backend/                       # Backend application
├── frontend/                      # Frontend application
├── docs/                          # Documentation
│   ├── API.md
│   ├── AGENTS.md
│   └── DEPLOYMENT.md
├── scripts/                       # Shared scripts
│   └── setup.sh
├── .gitignore
├── ARCHITECTURE.md
├── DATABASE_SCHEMA.sql
├── FOLDER_STRUCTURE.md
├── README.md
└── docker-compose.yml            # Local development setup
```

## Key Design Principles

### Backend
1. **Layered Architecture**: Controllers → Services → Repositories
2. **Dependency Injection**: Services receive dependencies via constructor
3. **Single Responsibility**: Each module has one clear purpose
4. **Interface-based**: Agents and tools implement interfaces
5. **Async-first**: All I/O operations are async

### Frontend
1. **Component-based**: Reusable, composable components
2. **Custom Hooks**: Business logic separated from UI
3. **Type-safe**: Full TypeScript coverage
4. **State Management**: Centralized state with Zustand
5. **Service Layer**: API calls abstracted from components

### Why This Structure?

1. **Scalability**: Easy to add new agents, tools, or features
2. **Testability**: Each layer can be tested independently
3. **Maintainability**: Clear separation of concerns
4. **Team-friendly**: Multiple developers can work in parallel
5. **Microservice-ready**: Can split into services later
