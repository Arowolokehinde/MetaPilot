// backend/src/processors/RuleProcessingProcessor.ts
import { Job } from 'bull';
import Task from '../models/Task';
import { ruleProcessingQueue } from '../services/QueueService';
import AIBridgeService from '../services/AIBridgeService';
import { logger } from '../utils/logger';

/**
 * Process natural language rules
 */
export async function processRule(job: Job): Promise<void> {
  try {
    const { taskId } = job.data;
    
    // Find the task
    const task = await Task.findById(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }
    
    let processedRule;
    
    // Process based on task type
    switch (task.type) {
      case 'eth-transfer':
        processedRule = await processETHTransferRule(task);
        break;
        
      default:
        throw new Error(`Unsupported task type for rule processing: ${task.type}`);
    }
    
    if (processedRule) {
      // Update task with processed rule
      if (task.type === 'eth-transfer') {
        // Update conditions based on natural language processing
        Object.assign(task.conditions, processedRule);
      }
      
      await task.save();
      logger.info(`Rule processing completed for task ${taskId}`);
    } else {
      logger.warn(`Rule processing failed for task ${taskId}`);
    }
  } catch (error) {
    logger.error(`Error processing rule for task ${job.data.taskId}:`, error);
    throw error;
  }
}

/**
 * Process ETH transfer rule
 */
async function processETHTransferRule(task: any): Promise<any> {
  try {
    // Look for a natural language rule in the task configuration
    const transferRule = task.configuration.transferRule;
    
    if (!transferRule) {
      // If we don't have a natural language rule, just use the existing conditions
      return null;
    }
    
    // Process rule with AI Bridge
    const processedRule = await AIBridgeService.processETHTransferRule(transferRule);
    
    // If AI returned recipient address or amount, update the configuration
    if (processedRule && processedRule.recipientAddress) {
      task.configuration.recipientAddress = processedRule.recipientAddress;
      delete processedRule.recipientAddress;
    }
    
    if (processedRule && processedRule.amount) {
      task.configuration.amount = processedRule.amount;
      delete processedRule.amount;
    }
    
    // Ensure the network is always Sepolia for the MVP
    task.network = 'sepolia';
    
    return processedRule;
  } catch (error) {
    logger.error(`Error processing ETH transfer rule:`, error);
    return null;
  }
}

// Process tasks in the rule processing queue
ruleProcessingQueue.process(processRule);

// Export a function to queue a task for rule processing
export async function queueRuleProcessing(taskId: string): Promise<void> {
  await ruleProcessingQueue.add({ taskId }, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  });
}