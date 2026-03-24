import { Tool } from '../../types/agent.types.js';
import { logger } from '../../utils/logger.js';
import { EmailTool } from '../implementations/EmailTool.js';
import { CalendarTool } from '../implementations/CalendarTool.js';
import { WebScraperTool } from '../implementations/WebScraperTool.js';
import { GitHubTool } from '../implementations/GitHubTool.js';
import { SlackTool } from '../implementations/SlackTool.js';

export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  constructor() {
    this.registerDefaultTools();
  }

  private registerDefaultTools() {
    // Register built-in tools
    this.register(new EmailTool());
    this.register(new CalendarTool());
    this.register(new WebScraperTool());
    this.register(new GitHubTool());
    this.register(new SlackTool());

    logger.info('[ToolRegistry] Default tools registered', {
      count: this.tools.size,
      tools: Array.from(this.tools.keys()),
    });
  }

  register(tool: Tool): void {
    if (this.tools.has(tool.name)) {
      logger.warn(`[ToolRegistry] Tool ${tool.name} already registered, overwriting`);
    }

    this.tools.set(tool.name, tool);
    logger.info(`[ToolRegistry] Tool registered: ${tool.name}`);
  }

  unregister(toolName: string): void {
    if (this.tools.delete(toolName)) {
      logger.info(`[ToolRegistry] Tool unregistered: ${toolName}`);
    } else {
      logger.warn(`[ToolRegistry] Tool ${toolName} not found`);
    }
  }

  getTool(toolName: string): Tool | undefined {
    return this.tools.get(toolName);
  }

  getAllTools(): Tool[] {
    return Array.from(this.tools.values());
  }

  getToolsByCategory(category: string): Tool[] {
    // In production, tools would have categories
    // For now, return all tools
    return this.getAllTools();
  }

  hasPermission(agentId: string, toolName: string): boolean {
    // In production, check agent_tools table in database
    // For now, allow all tools for all agents
    return this.tools.has(toolName);
  }

  async executeTool(toolName: string, params: any): Promise<any> {
    const tool = this.getTool(toolName);

    if (!tool) {
      throw new Error(`Tool ${toolName} not found`);
    }

    logger.info(`[ToolRegistry] Executing tool: ${toolName}`, { params });

    try {
      const result = await tool.execute(params);
      return result;
    } catch (error: any) {
      logger.error(`[ToolRegistry] Tool execution failed: ${toolName}`, error);
      throw error;
    }
  }

  getToolDefinitions(): any[] {
    return this.getAllTools().map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    }));
  }
}
