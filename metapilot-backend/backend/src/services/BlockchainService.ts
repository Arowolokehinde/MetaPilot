// backend/src/services/BlockchainService.ts
import { ethers } from 'ethers';
import { logger } from '../utils/logger';
import SessionKeyService from './SessionKeyService';
import User from '../models/User';
import Task from '../models/Task'; // Direct import instead of require

// ETH Transfer Executor ABI
const ETH_TRANSFER_EXECUTOR_ABI = [
  'function executeTransfer(address delegator, address recipient, uint256 amount) external'
];

class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private chainId: number;
  
  constructor() {
    // For MVP, we'll focus only on Sepolia
    const sepoliaRpcUrl = process.env.SEPOLIA_RPC_URL;
    
    if (!sepoliaRpcUrl) {
      throw new Error('SEPOLIA_RPC_URL environment variable is not set');
    }
    
    this.provider = new ethers.JsonRpcProvider(sepoliaRpcUrl);
    this.chainId = 11155111; // Sepolia chain ID
    
    logger.info(`BlockchainService initialized on Sepolia (chainId: ${this.chainId})`);
  }
  
  /**
   * Get the Sepolia provider
   */
  getProvider(): ethers.JsonRpcProvider {
    return this.provider;
  }
  
  /**
   * Get ETH price from a price feed
   */
  async getETHPrice(): Promise<string> {
    try {
      // For MVP on testnet, we'll use a simplified price oracle
      // In production, this would connect to APIs like CoinGecko, Chainlink, etc.
      
      // Mock ETH price in USD (8 decimals for precision)
      return '300000000000'; // $3000.00 with 8 decimals
    } catch (error: any) {
      logger.error('Error getting ETH price:', error);
      throw error;
    }
  }
  
  /**
   * Get ETH balance of an address
   */
  async getBalance(address: string): Promise<string> {
    try {
      const balance = await this.provider.getBalance(address);
      return balance.toString();
    } catch (error: any) {
      logger.error(`Error getting balance for ${address}:`, error);
      throw error;
    }
  }
  
  /**
   * Get current gas price
   */
  async getGasPrice(): Promise<string> {
    try {
      const feeData = await this.provider.getFeeData();
      
      // Use gasPrice for networks that don't use EIP-1559
      if (feeData.gasPrice) {
        return feeData.gasPrice.toString();
      }
      
      // Fall back to maxFeePerGas for EIP-1559 networks
      if (feeData.maxFeePerGas) {
        return feeData.maxFeePerGas.toString();
      }
      
      throw new Error('Could not retrieve gas price');
    } catch (error: any) {
      logger.error('Error getting gas price:', error);
      throw error;
    }
  }
  
  /**
   * Check if ETH transfer condition is met
   */
  async isETHTransferConditionMet(
    taskId: string,
    conditionType: string,
    conditions: any
  ): Promise<boolean> {
    try {
      // Handle different condition types
      switch (conditionType) {
        case 'price_threshold': {
          if (!conditions.priceCondition) return false;
          
          // Get current ETH price
          const currentPrice = await this.getETHPrice();
          const currentPriceBigInt = BigInt(currentPrice);
          
          // Reference price when the task was created
          const referencePriceBigInt = conditions.priceCondition.referencePrice ? 
            BigInt(conditions.priceCondition.referencePrice) : currentPriceBigInt;
          
          // Log for debugging
          logger.debug(`Task ${taskId} price condition check: Current price = ${currentPrice}, Reference = ${conditions.priceCondition.referencePrice}`);
          
          // Check if price is above or below threshold
          if (conditions.priceCondition.type === 'above') {
            const threshold = BigInt(conditions.priceCondition.priceThreshold);
            return currentPriceBigInt >= threshold;
          } else if (conditions.priceCondition.type === 'below') {
            const threshold = BigInt(conditions.priceCondition.priceThreshold);
            return currentPriceBigInt <= threshold;
          }
          
          return false;
        }
        
        case 'balance_threshold': {
          if (!conditions.balanceCondition) return false;
          
          // Get the user's address from the task
          const task = await Task.findById(taskId);
          if (!task) return false;
          
          const user = await User.findById(task.userId);
          if (!user) return false;
          
          // Get current balance
          const balance = await this.getBalance(user.address);
          const balanceBigInt = BigInt(balance);
          
          // Log for debugging
          logger.debug(`Task ${taskId} balance condition check: Current balance = ${balance}, Threshold = ${conditions.balanceCondition.balanceThreshold}`);
          
          // Check if balance is above or below threshold
          if (conditions.balanceCondition.type === 'above') {
            const threshold = BigInt(conditions.balanceCondition.balanceThreshold);
            return balanceBigInt >= threshold;
          } else if (conditions.balanceCondition.type === 'below') {
            const threshold = BigInt(conditions.balanceCondition.balanceThreshold);
            return balanceBigInt <= threshold;
          }
          
          return false;
        }
        
        case 'gas_price': {
          if (!conditions.gasPriceCondition) return false;
          
          // Get current gas price
          const gasPrice = await this.getGasPrice();
          const gasPriceBigInt = BigInt(gasPrice);
          
          // Log for debugging
          logger.debug(`Task ${taskId} gas price condition check: Current gas price = ${gasPrice}, Threshold = ${conditions.gasPriceCondition.gasPriceThreshold}`);
          
          // Check if gas price is below threshold
          if (conditions.gasPriceCondition.type === 'below') {
            const threshold = BigInt(conditions.gasPriceCondition.gasPriceThreshold);
            return gasPriceBigInt <= threshold;
          }
          
          return false;
        }
        
        case 'time_based':
          // Time-based conditions are handled by the scheduler, not here
          return false;
        
        default:
          return false;
      }
    } catch (error: any) {
      logger.error(`Error checking ETH transfer condition for task ${taskId}:`, error);
      return false;
    }
  }
  
  /**
   * Get signer from session key
   */
  async getSessionKeySigner(sessionKeyAddress: string): Promise<ethers.Wallet | null> {
    try {
      // Get session key from DB
      const sessionKey = await SessionKeyService.getSessionKey(sessionKeyAddress);
      if (!sessionKey || !sessionKey.privateKey) {
        logger.error(`No private key found for session key ${sessionKeyAddress}`);
        return null;
      }
      
      // Create signer
      const signer = new ethers.Wallet(sessionKey.privateKey, this.provider);
      
      return signer;
    } catch (error: any) {
      logger.error('Error getting session key signer:', error);
      return null;
    }
  }
  
  /**
   * Execute ETH transfer transaction
   */
  async executeETHTransfer(
    sessionKeyAddress: string,
    executorAddress: string,
    params: {
      recipientAddress: string;
      amount: string;
    }
  ): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    try {
      // Get signer from session key
      const signer = await this.getSessionKeySigner(sessionKeyAddress);
      if (!signer) {
        return { 
          success: false, 
          error: 'Failed to get signer from session key' 
        };
      }
      
      // Get delegator address from the session key
      const delegator = await this.getDelegatorFromSessionKey(sessionKeyAddress);
      if (!delegator) {
        return {
          success: false,
          error: 'Failed to get delegator address from session key'
        };
      }
      
      // Create contract instance for the executor
      const executorContract = new ethers.Contract(
        executorAddress,
        ETH_TRANSFER_EXECUTOR_ABI,
        signer
      );
      
      // Log transaction information
      logger.info(`Executing ETH transfer: ${params.amount} ETH from ${delegator} to ${params.recipientAddress}`);
      
      // Execute the transfer
      const tx = await executorContract.executeTransfer(
        delegator,
        params.recipientAddress,
        params.amount
      );
      
      logger.info(`Transaction sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      logger.info(`Transaction confirmed: ${receipt.hash}`);
      
      return {
        success: true,
        transactionHash: receipt.hash
      };
    } catch (error: any) {
      logger.error('Error executing ETH transfer:', error);
      return { 
        success: false, 
        error: error.message || 'Unknown error' 
      };
    }
  }
  
  /**
   * Get delegator address from session key
   */
  private async getDelegatorFromSessionKey(sessionKeyAddress: string): Promise<string | null> {
    try {
      // Find user with this session key
      const user = await User.findOne({
        'delegations.sessionKeyAddress': sessionKeyAddress,
        'delegations.status': 'active'
      });
      
      if (!user) {
        logger.error(`No active delegation found for session key ${sessionKeyAddress}`);
        return null;
      }
      
      return user.address;
    } catch (error: any) {
      logger.error('Error getting delegator from session key:', error);
      return null;
    }
  }
}

export default new BlockchainService();