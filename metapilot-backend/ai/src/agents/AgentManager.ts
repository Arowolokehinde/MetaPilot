import { logger } from '../utils/logger';
import GaiaService from '../services/GaiaService';

class AgentManager {
  /**
   * Create a new agent for a user
   */
  async createAgentForUser(userId: string, walletAddress: string): Promise<string> {
    try {
      const agent = await GaiaService.createAgent(
        userId,
        `MetaPilot Agent for ${walletAddress.substring(0, 8)}...`,
        `Autonomous agent for Sepolia ETH transfers for wallet ${walletAddress}`
      );
      
      return agent.id;
    } catch (error: any) { // Added type annotation
      logger.error(`Error creating agent for user ${userId}:`, error);
      throw error;
    }
  }
  
  /**
   * Execute an ETH transfer action
   */
  async executeETHTransfer(
    agentId: string,
    params: {
      sessionKeyAddress: string;
      privateKey: string;
      recipientAddress: string;
      amount: string;
    }
  ): Promise<any> {
    try {
      return await GaiaService.executeAction(
        agentId,
        'eth-transfer', // Changed from 'eth_transfer' to 'eth-transfer' to match GaiaService
        {
          recipientAddress: params.recipientAddress,
          amount: params.amount,
          network: 'sepolia' // Explicitly specify Sepolia network
        },
        {
          address: params.sessionKeyAddress,
          privateKey: params.privateKey
        }
      );
    } catch (error: any) { // Added type annotation
      logger.error(`Error executing ETH transfer:`, error);
      throw error;
    }
  }
}

export default new AgentManager();