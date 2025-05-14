// backend/src/services/AIBridgeService.ts
import axios from 'axios';
import { logger } from '../utils/logger';

/**
 * Service to connect with the AI component for rule processing and task execution
 * Focused on ETH transfers on Sepolia testnet
 */
class AIBridgeService {
  private baseUrl: string;
  
  constructor() {
    // In development, this would point to the AI service
    // In production deployment, this would be the AI service's URL
    this.baseUrl = process.env.AI_SERVICE_URL || 'http://localhost:3001/api';
    
    logger.info(`AI Bridge initialized with URL: ${this.baseUrl}`);
  }
  
  /**
   * Process an ETH transfer rule
   */
  async processETHTransferRule(transferRule: string): Promise<any> {
    try {
      const response = await axios.post(`${this.baseUrl}/rules/eth-transfer`, {
        transferRule,
        network: 'sepolia' // Always use Sepolia for MVP
      });
      
      return response.data.conditions;
    } catch (error) {
      logger.error('Error processing ETH transfer rule:', error);
      return null;
    }
  }
  
  /**
   * Execute an ETH transfer via the AI agent
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
      // Add network parameter for Sepolia
      const requestParams = {
        ...params,
        network: 'sepolia' // Always use Sepolia for MVP
      };
      
      const response = await axios.post(`${this.baseUrl}/agents/${agentId}/execute/eth-transfer`, requestParams);
      
      return response.data;
    } catch (error) {
      logger.error('Error executing ETH transfer via AI agent:', error);
      throw error;
    }
  }
  
  /**
   * Create an agent for a user
   */
  async createAgentForUser(userId: string, walletAddress: string): Promise<string> {
    try {
      const response = await axios.post(`${this.baseUrl}/agents`, {
        userId,
        walletAddress,
        network: 'sepolia', // Always use Sepolia for MVP
        purpose: 'eth_transfer' // Specify agent purpose
      });
      
      return response.data.agentId;
    } catch (error) {
      logger.error('Error creating agent for user:', error);
      throw error;
    }
  }
  
  /**
   * Check if AI service is available
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/health`);
      return response.status === 200;
    } catch (error) {
      logger.error('AI service health check failed:', error);
      return false;
    }
  }
}

export default new AIBridgeService();