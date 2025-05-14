import axios from 'axios';
import { logger } from '../utils/logger';

class GaiaService {
  private apiKey: string | undefined;
  private baseUrl: string;
  
  constructor() {
    this.apiKey = process.env.GAIA_API_KEY;
    this.baseUrl= process.env.GAIA_API_URL || 'https://api.gaia.ai/v1';
    
    if (!this.apiKey) {
      logger.warn('GAIA_API_KEY not set. Gaia AI functionality will be limited.');
    }
  }
  
  /**
   * Create an agent in Gaia
   */
  async createAgent(userId: string, name: string, description: string): Promise<any> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/agents`,
        {
          name,
          description,
          metadata: {
            userId,
            app: 'MetaPilot',
            network: 'sepolia'  // Explicitly set Sepolia network
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      logger.info(`Created Gaia agent for user ${userId}: ${response.data.id}`);
      return response.data;
    } catch (error: any) {
      logger.error('Error creating Gaia agent:', error);
      throw new Error(`Failed to create Gaia agent: ${error.message}`);
    }
  }
  
  /**
   * Process natural language rule with Gaia AI
   */
  async processNaturalLanguageRule(rule: string, taskType: string): Promise<any> {
    try {
      const prompt = this.buildRuleProcessingPrompt(rule, taskType);
      
      const response = await axios.post(
        `${this.baseUrl}/completions`,
        {
          prompt,
          max_tokens: 500,
          model: 'gaia-1',
          temperature: 0.1, // Low temperature for more deterministic outputs
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Parse the structured output from AI
      return this.parseAIResponse(response.data.choices[0].text, taskType);
    } catch (error: any) {
      logger.error('Error processing natural language rule with Gaia:', error);
      throw new Error(`Failed to process rule with Gaia: ${error.message}`);
    }
  }
  
  /**
   * Execute an action using Gaia agent (autonomous execution)
   */
  async executeAction(
    agentId: string, 
    actionType: string, 
    parameters: Record<string, any>,
    sessionKeyData: {
      address: string;
      privateKey: string;
    }
  ): Promise<any> {
    try {
      // Add network parameter if not specified
      if (!parameters.network) {
        parameters.network = 'sepolia';
      }
      
      const response = await axios.post(
        `${this.baseUrl}/agents/${agentId}/actions`,
        {
          type: actionType,
          parameters,
          auth: {
            type: 'session_key',
            session_key: sessionKeyData
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      logger.info(`Executed Gaia action ${actionType} for agent ${agentId}: ${response.data.id}`);
      return response.data;
    } catch (error: any) {
      logger.error(`Error executing Gaia action ${actionType}:`, error);
      throw new Error(`Failed to execute action with Gaia: ${error.message}`);
    }
  }
  
  /**
   * Build prompt for rule processing
   */
  private buildRuleProcessingPrompt(rule: string, taskType: string): string {
    if (taskType === 'eth-transfer') {
      return `
        You are an AI assistant processing natural language rules for ETH transfer automation on Sepolia testnet.
        The user has provided the following rule: "${rule}"
        
        Extract the key conditions for ETH transfers.
        Format your response as a structured JSON object with:
        - conditionType: "price_threshold", "balance_threshold", "gas_price", "time_based"
        - thresholdType: "above" or "below" (for price or balance conditions)
        - priceThreshold: number (if price threshold condition)
        - balanceThreshold: number (if balance threshold condition)
        - gasPriceThreshold: number (if gas price condition)
        - frequency: "hourly", "daily", "weekly" (if time-based)
        - recipientAddress: string (if specified in the rule)
        - amount: number (ETH amount if specified in the rule)
        - rationale: brief explanation of the logic
        
        Only respond with valid JSON.
      `;
    }
    
    // Default fallback prompt
    return `
      You are an AI assistant processing natural language rules for ETH transfers on Sepolia testnet.
      The user has provided the following rule: "${rule}"
      
      Extract the key conditions from this rule.
      Format your response as a structured JSON object with relevant fields.
      
      Only respond with valid JSON.
    `;
  }
  
  /**
   * Parse AI response based on task type
   */
  private parseAIResponse(aiResponse: string, taskType: string): any {
    try {
      // Extract JSON from the response (in case there's any non-JSON text)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in AI response');
      }
      
      const parsedResponse = JSON.parse(jsonMatch[0]);
      
      // Validate based on task type
      if (taskType === 'eth-transfer') {
        if (!parsedResponse.conditionType) {
          throw new Error('Missing condition type in ETH transfer rule processing');
        }
      }
      
      return parsedResponse;
    } catch (error: any) {
      logger.error('Error parsing AI response:', error);
      return null;
    }
  }
}

export default new GaiaService();