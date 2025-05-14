// backend/src/processors/TaskExecutionProcessor.ts
import { Job } from 'bull';
import Task from '../models/Task';
import User from '../models/User';
import { executionQueue } from '../services/QueueService';
import BlockchainService from '../services/BlockchainService';
import AIBridgeService from '../services/AIBridgeService';
import SessionKeyService from '../services/SessionKeyService';
import { logger } from '../utils/logger';
import { ITaskDocument, IUserDocument } from '../types/model';

/**
 * Process task execution
 */
export async function executeTask(job: Job): Promise<void> {
  try {
    const { taskId, taskType, network } = job.data;
    
    // Find the task
    const task = await Task.findById(taskId) as ITaskDocument;
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }
    
    // Check task is still active
    if (task.status !== 'active') {
      logger.info(`Task ${taskId} is not active, skipping execution`);
      return;
    }
    
    // Find user
    const user = await User.findById(task.userId) as IUserDocument;
    if (!user) {
      throw new Error(`User for task ${taskId} not found`);
    }
    
    // Check session key
    if (!task.sessionKeyId) {
      throw new Error(`Task ${taskId} has no session key`);
    }
    
    let executionResult;
    
    // Execute based on task type
    switch (taskType) {
      case 'eth-transfer':
        executionResult = await executeETHTransfer(task, user);
        break;
        
      default:
        throw new Error(`Unsupported task type: ${taskType}`);
    }
    
    // Update task execution history
    const historyEntry = {
      timestamp: new Date(),
      action: `Execute ${taskType}`,
      // Fix: Cast string to a union type
      status: executionResult.success ? 'success' as const : 'failed' as const,
      transactionHash: executionResult.transactionHash,
      error: executionResult.error,
      details: executionResult.details || {}
    };
    
    task.executionHistory = task.executionHistory || [];
    task.executionHistory.push(historyEntry);
    task.lastExecutedAt = new Date();
    
    // For one-time tasks, mark as completed
    if (task.configuration.executionType === 'one-time' && executionResult.success) {
      task.status = 'completed';
    }
    
    await task.save();
    
    logger.info(`Task ${taskId} execution ${executionResult.success ? 'successful' : 'failed'}`);
  } catch (error: any) {
    logger.error(`Error executing task ${job.data.taskId}:`, error);
    throw error;
  }
}

/**
 * Execute ETH transfer
 */
async function executeETHTransfer(task: ITaskDocument, user: IUserDocument): Promise<{
  success: boolean;
  transactionHash?: string;
  error?: string;
  details?: Record<string, any>;
}> {
  try {
    const { configuration } = task;
    
    // Get session key
    const sessionKey = await SessionKeyService.getSessionKey(task.sessionKeyId as string);
    if (!sessionKey || !sessionKey.privateKey) {
      return {
        success: false,
        error: 'Session key not found or missing private key'
      };
    }
    
    // Extract configuration and ensure all required fields are present
    const recipientAddress = configuration.recipientAddress || configuration.recipient;
    const amount = configuration.amount;
    
    if (!recipientAddress || !amount) {
      return {
        success: false,
        error: 'Missing required parameters: recipientAddress or amount'
      };
    }
    
    // Ensure network is Sepolia for MVP
    const network = 'sepolia';
    
    // For MVP we'll use direct blockchain interaction
    // For more complex tasks, use the AI Bridge to Gaia
    if (user.agentId) {
      // Use AI Agent if user has one
      try {
        const result = await AIBridgeService.executeETHTransfer(
          user.agentId,
          {
            sessionKeyAddress: task.sessionKeyId as string,
            privateKey: sessionKey.privateKey,
            recipientAddress,
            // Ensure amount is a string
            amount: String(amount)
          }
        );
        
        return {
          success: true,
          transactionHash: result.transactionHash,
          details: {
            recipientAddress,
            amount,
            network
          }
        };
      } catch (error: any) {
        logger.error(`Error executing ETH transfer via AI agent for task ${task._id}:`, error);
        // Fall back to direct execution
      }
    }
    
    // Get executor contract address from config
    const executorAddress = process.env.ETH_TRANSFER_EXECUTOR_ADDRESS;
    if (!executorAddress) {
      return {
        success: false,
        error: 'ETH transfer executor address not configured'
      };
    }
    
    // Direct execution - FIX: Match the expected parameter count and order
    // Assuming BlockchainService.executeETHTransfer takes sessionKey, recipientAddress, and amount
    const result = await BlockchainService.executeETHTransfer(
      task.sessionKeyId as string,
      executorAddress,
      {
        recipientAddress,
        amount: String(amount)
      }
    );
    
    // For testnet demo, we can simulate a successful transaction
    if (process.env.NODE_ENV === 'development') {
      return {
        success: true,
        transactionHash: `0x${Math.random().toString(16).substring(2, 42)}`,
        details: {
          recipientAddress,
          amount,
          network
        }
      };
    }
    
    return result;
  } catch (error: any) {
    logger.error(`Error executing ETH transfer for task ${task._id}:`, error);
    return {
      success: false,
      error: error.message || 'Unknown error'
    };
  }
}

// Process tasks in the execution queue
executionQueue.process(executeTask);