// backend/src/processors/TaskMonitorProcessor.ts
import { Job } from 'bull';
import Task from '../models/Task';
import User from '../models/User';
import { monitoringQueue, executionQueue } from '../services/QueueService';
import BlockchainService from '../services/BlockchainService';
import { logger } from '../utils/logger';
import { ITaskDocument } from '../types/model';

/**
 * Process tasks to check if conditions are met
 */
export async function monitorTaskConditions(job: Job): Promise<void> {
  try {
    const { taskType, network } = job.data;
    
    // Ensure we're only monitoring ETH transfer tasks on Sepolia
    const type = 'eth-transfer';
    const networkToMonitor = 'sepolia';
    
    // Find active tasks of ETH transfer type
    const tasks = await Task.find({
      type: type,
      status: 'active',
      network: networkToMonitor,
      nextCheckAt: { $lte: new Date() }
    }) as ITaskDocument[];
    
    logger.info(`Monitoring ${tasks.length} ${type} tasks on ${networkToMonitor}`);
    
    // Process each task
    for (const task of tasks) {
      try {
        // Check if condition is met
        const conditionMet = await handleETHTransferCondition(task);
        
        // If condition is met, queue for execution
        if (conditionMet) {
          logger.info(`Condition met for task ${task._id}, queuing for execution`);
          
          await executionQueue.add(
            {
              taskId: task._id.toString(),
              taskType: type,
              network: networkToMonitor
            },
            {
              attempts: 3,
              backoff: {
                type: 'exponential',
                delay: 5000
              }
            }
          );
          
          // Update task with condition check
          task.lastCheckedAt = new Date();
          await task.save();
        } else {
          // Update next check time
          task.lastCheckedAt = new Date();
          task.nextCheckAt = new Date(Date.now() + 5 * 60 * 1000); // Check again in 5 minutes
          await task.save();
        }
      } catch (error: any) {
        logger.error(`Error processing task ${task._id}:`, error);
        
        // Update task with error
        task.lastCheckedAt = new Date();
        task.nextCheckAt = new Date(Date.now() + 15 * 60 * 1000); // Longer delay after error
        await task.save();
      }
    }
  } catch (error: any) {
    logger.error('Error in task condition monitoring:', error);
    throw error;
  }
}

/**
 * Handle ETH transfer condition
 */
async function handleETHTransferCondition(task: ITaskDocument): Promise<boolean> {
  try {
    const { conditions } = task;
    
    // Skip if we don't have a session key
    if (!task.sessionKeyId) {
      logger.warn(`Task ${task._id} has no session key, skipping`);
      return false;
    }
    
    const {
      conditionType,
      priceCondition,
      balanceCondition,
      gasPriceCondition
    } = conditions;
    
    let conditionMet = false;
    
    // Check based on condition type
    switch (conditionType) {
      case 'price_threshold':
        if (!priceCondition) return false;
        
        // Get current ETH price - FIX: Remove the network parameter if not needed
        const ethPrice = await BlockchainService.getETHPrice();
        
        if (priceCondition.type === 'above') {
          conditionMet = BigInt(ethPrice) >= BigInt(priceCondition.priceThreshold);
        } else if (priceCondition.type === 'below') {
          conditionMet = BigInt(ethPrice) <= BigInt(priceCondition.priceThreshold);
        }
        break;
        
      case 'balance_threshold':
        if (!balanceCondition) return false;
        
        // Get delegator balance
        const delegator = await User.findById(task.userId);
        if (!delegator) return false;
        
        // FIX: Check if getBalance also doesn't need a network parameter
        const balance = await BlockchainService.getBalance(delegator.address);
        
        if (balanceCondition.type === 'above') {
          conditionMet = BigInt(balance) >= BigInt(balanceCondition.balanceThreshold);
        } else if (balanceCondition.type === 'below') {
          conditionMet = BigInt(balance) <= BigInt(balanceCondition.balanceThreshold);
        }
        break;
        
      case 'gas_price':
        if (!gasPriceCondition) return false;
        
        // Get current gas price - FIX: Check if getGasPrice also doesn't need a network parameter
        const gasPrice = await BlockchainService.getGasPrice();
        
        if (gasPriceCondition.type === 'below') {
          conditionMet = BigInt(gasPrice) <= BigInt(gasPriceCondition.gasPriceThreshold);
        }
        break;
        
      case 'time_based':
        // Time-based conditions are handled by the scheduler
        // We'll always return false here and let the scheduler handle it
        return false;
        
      default:
        return false;
    }
    
    return conditionMet;
  } catch (error: any) {
    logger.error(`Error checking ETH transfer condition for task ${task._id}:`, error);
    return false;
  }
}

// Set up the processor
monitoringQueue.process(monitorTaskConditions);

// Schedule recurring checks
export function scheduleTaskMonitoring() {
  // Schedule ETH transfer monitoring every 5 minutes
  monitoringQueue.add(
    { taskType: 'eth-transfer', network: 'sepolia' },
    { 
      repeat: { cron: '*/5 * * * *' }, // Every 5 minutes
      jobId: 'eth-transfer-sepolia-monitor'
    }
  );
  
  logger.info('ETH transfer monitoring scheduled on Sepolia');
}