import cron from 'node-cron';
import { logger } from '../config/logger.config';
import Task, { TaskStatus } from '../models/task.model';
import { enqueueTask } from './queue.provider';

// Scheduling intervals
const INTERVALS = {
    dao: '*/5 * * * *',       // Every 5 minutes
    token: '*/3 * * * *',     // Every 3 minutes
    staking: '*/10 * * * *',  // Every 10 minutes
    liquidity: '*/15 * * * *', // Every 15 minutes
    nft: '*/30 * * * *',      // Every 30 minutes
    yield: '0 */1 * * *',     // Every hour
    rewards: '0 */2 * * *',   // Every 2 hours
};

/**
 * Schedule a specific task
 */
export async function scheduleTask(task: any) {
    // Skip if task is not active
    if (task.status !== TaskStatus.ACTIVE) {
        logger.info(`Task ${task.taskId} is not active, skipping scheduling`);
        return;
    }

    try {
        // Enqueue task for immediate processing
        await enqueueTask(task.type, {
            taskId: task.taskId,
            walletAddress: task.walletAddress,
            userId: task.userId,
            rules: task.rules,
            metadata: task.metadata,
            type: task.type,
        });

        logger.info(`Task ${task.taskId} scheduled for processing`);

        return true;
    } catch (error) {
        logger.error(`Error scheduling task ${task.taskId}:`, error);
        return false;
    }
}

/**
 * Start the scheduler for all task types
 */
export function startScheduler() {
    // Schedule DAO vote tasks
    cron.schedule(INTERVALS.dao, async () => {
        logger.info('Running DAO vote task scheduler');
        await scheduleTasksByType('dao_vote');
    });

    // Schedule token purchase tasks
    cron.schedule(INTERVALS.token, async () => {
        logger.info('Running token purchase task scheduler');
        await scheduleTasksByType('buy_token');
    });

    // Schedule token swap tasks
    cron.schedule(INTERVALS.token, async () => {
        logger.info('Running token swap task scheduler');
        await scheduleTasksByType('token_swap');
    });

    // Schedule staking tasks
    cron.schedule(INTERVALS.staking, async () => {
        logger.info('Running staking task scheduler');
        await scheduleTasksByType('staking');
    });

    // Schedule liquidity tasks
    cron.schedule(INTERVALS.liquidity, async () => {
        logger.info('Running liquidity task scheduler');
        await scheduleTasksByType('liquidity_provision');
    });

    // Schedule NFT purchase tasks
    cron.schedule(INTERVALS.nft, async () => {
        logger.info('Running NFT purchase task scheduler');
        await scheduleTasksByType('nft_purchase');
    });

    // Schedule yield optimization tasks
    cron.schedule(INTERVALS.yield, async () => {
        logger.info('Running yield optimization task scheduler');
        await scheduleTasksByType('yield_optimization');
    });

    // Schedule reward claim tasks
    cron.schedule(INTERVALS.rewards, async () => {
        logger.info('Running reward claim task scheduler');
        await scheduleTasksByType('claim_rewards');
    });

    logger.info('Task schedulers started');
}

/**
 * Schedule all tasks of a specific type
 */
async function scheduleTasksByType(taskType: string) {
    try {
        // Find all active tasks of the specified type
        const tasks = await Task.find({
            type: taskType,
            status: TaskStatus.ACTIVE,
        });

        logger.info(`Found ${tasks.length} active ${taskType} tasks to schedule`);

        // Schedule each task
        for (const task of tasks) {
            await scheduleTask(task);
        }

        return true;
    } catch (error) {
        logger.error(`Error scheduling tasks of type ${taskType}:`, error);
        return false;
    }
}

/**
 * Manual trigger to force recheck of all tasks
 */
export async function forceRecheckAllTasks() {
    logger.info('Force rechecking all active tasks');

    try {
        // Find all active tasks
        const tasks = await Task.find({
            status: TaskStatus.ACTIVE,
        });

        logger.info(`Found ${tasks.length} active tasks to recheck`);

        // Schedule each task
        for (const task of tasks) {
            await scheduleTask(task);
        }

        return {
            success: true,
            message: `Scheduled ${tasks.length} tasks for rechecking`,
        };
    } catch (error: any) {
        logger.error('Error rechecking all tasks:', error);
        return {
            success: false,
            message: `Error rechecking tasks: ${error.message}`,
        };
    }
}