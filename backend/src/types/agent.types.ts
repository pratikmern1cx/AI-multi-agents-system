export type AgentType = 'planner' | 'research' | 'execution' | 'review' | 'custom';

export type AgentStatus = 'idle' | 'thinking' | 'executing' | 'waiting' | 'completed' | 'failed';

export interface AgentConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  [key: string]: any;
}

export interface AgentMessage {
  id: string;
  from: string;
  to: string;
  type: 'request' | 'response' | 'broadcast';
  content: any;
  timestamp: Date;
}

export interface AgentContext {
  conversationId: string;
  userId: string;
  sessionMemory: Map<string, any>;
  longTermMemory?: any[];
}

export interface AgentResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    tokensUsed?: number;
    executionTime?: number;
    toolsCalled?: string[];
  };
}

export interface Tool {
  name: string;
  description: string;
  parameters: any;
  execute: (params: any) => Promise<any>;
}
