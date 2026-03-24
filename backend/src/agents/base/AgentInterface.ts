import { AgentConfig, AgentContext, AgentResult, Tool } from '../../types/agent.types.js';

export interface IAgent {
  id: string;
  name: string;
  type: string;
  systemPrompt: string;
  config: AgentConfig;
  tools: Tool[];
  
  execute(input: string, context: AgentContext): Promise<AgentResult>;
  addTool(tool: Tool): void;
  removeTool(toolName: string): void;
}
