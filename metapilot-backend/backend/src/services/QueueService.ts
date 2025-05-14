// backend/src/services/QueueService.ts
import Bull from 'bull';
import { logger } from '../utils/logger';

// Make sure we have a valid REDIS_URL or use a default
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

// Queue for monitoring ETH transfer conditions (price, balance, gas)
const monitoringQueue = new Bull('eth-transfer-monitor', REDIS_URL);

// Queue for executing ETH transfers when conditions are met
const executionQueue = new Bull('eth-transfer-execution', REDIS_URL);

// Queue for processing natural language rules using AI
const ruleProcessingQueue = new Bull('eth-transfer-rule-processing', REDIS_URL);

// Set up basic error handling for all queues
[monitoringQueue, executionQueue, ruleProcessingQueue].forEach(queue => {
  queue.on('error', (error: Error) => {
    logger.error(`Queue error: ${queue.name}`, error);
  });
  
  queue.on('failed', (job, error: Error) => {
    logger.error(`Job failed: ${queue.name}:${job.id}`, error);
  });
  
  // Add completed event logging
  queue.on('completed', (job) => {
    logger.info(`Job completed: ${queue.name}:${job.id}`);
  });
});

// Log queue initialization
logger.info('ETH transfer queues initialized on Sepolia network');

export {
  monitoringQueue,
  executionQueue,
  ruleProcessingQueue
};