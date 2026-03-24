import { IAgent } from '../base/AgentInterface.js';
import { logger } from '../../utils/logger.js';

export class AgentRegistry {
  private agents: Map<string, IAgent> = new Map();
  private agentsByType: Map<string, IAgent[]> = new Map();

  register(agent: IAgent): void {
    this.agents.set(agent.id, agent);
    
    // Index by type
    const typeAgents = this.agentsByType.get(agent.type) || [];
    typeAgents.push(agent);
    this.agentsByType.set(agent.type, typeAgents);
    
    logger.info(`[AgentRegistry] Registered agent: ${agent.name} (${agent.type})`);
  }

  unregister(agentId: string): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      this.agents.delete(agentId);
      
      // Remove from type index
      const typeAgents = this.agentsByType.get(agent.type) || [];
      this.agentsByType.set(
        agent.type,
        typeAgents.filter(a => a.id !== agentId)
      );
      
      logger.info(`[AgentRegistry] Unregistered agent: ${agent.name}`);
    }
  }

  getAgent(agentId: string): IAgent | null {
    return this.agents.get(agentId) || null;
  }

  getAgentByType(type: string): IAgent | null {
    const agents = this.agentsByType.get(type) || [];
    return agents[0] || null;
  }

  getAllAgents(): IAgent[] {
    return Array.from(this.agents.values());
  }

  getAgentsByType(type: string): IAgent[] {
    return this.agentsByType.get(type) || [];
  }
}
