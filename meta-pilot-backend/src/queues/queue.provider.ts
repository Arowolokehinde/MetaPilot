import { Queue, Worker, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import { logger } from '../config/logger.config';
import env from '../config/env.config';
import { TaskType } from '../models/task.model';
import {
    processDaoVoteTask,
    processTokenPurchaseTask,
    processTokenSwapTask,
    processStakingTask,
    processLiquidityTask,
    processNftPurchaseTask,
    processYieldOptimizationTask,
    processRewardClaimTask
} from './task.processor';

// Redis connection options
const redisOptions = {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
    maxRetriesPerRequest: 10,
};

// Define proper interface for queue stats
interface QueueStats {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
}

// Create Redis connections
const redisConnection = new IORedis(redisOptions);
const redisSubscriber = new IORedis(redisOptions);

// Queue names
export enum QueueName {
    DAO_VOTE = 'dao-vote-queue',
    TOKEN_PURCHASE = 'token-purchase-queue',
    TOKEN_SWAP = 'token-swap-queue',
    STAKING = 'staking-queue',
    LIQUIDITY = 'liquidity-queue',
    NFT_PURCHASE = 'nft-purchase-queue',
    YIELD_OPTIMIZATION = 'yield-optimization-queue',
    REWARD_CLAIM = 'reward-claim-queue',
}

// Define queues
const daoVoteQueue = new Queue(QueueName.DAO_VOTE, {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: 100,
    },
});

const tokenPurchaseQueue = new Queue(QueueName.TOKEN_PURCHASE, {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: 100,
    },
});

const tokenSwapQueue = new Queue(QueueName.TOKEN_SWAP, {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: 100,
    },
});

const stakingQueue = new Queue(QueueName.STAKING, {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: 100,
    },
});

const liquidityQueue = new Queue(QueueName.LIQUIDITY, {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: 100,
    },
});

const nftPurchaseQueue = new Queue(QueueName.NFT_PURCHASE, {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: 100,
    },
});

const yieldOptimizationQueue = new Queue(QueueName.YIELD_OPTIMIZATION, {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: 100,
    },
});

const rewardClaimQueue = new Queue(QueueName.REWARD_CLAIM, {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: 100,
    },
});

// Map task types to queues
export const taskQueueMap = {
    [TaskType.DAO_VOTE]: daoVoteQueue,
    [TaskType.BUY_TOKEN]: tokenPurchaseQueue,
    [TaskType.TOKEN_SWAP]: tokenSwapQueue,
    [TaskType.STAKING]: stakingQueue,
    [TaskType.LIQUIDITY_PROVISION]: liquidityQueue,
    [TaskType.NFT_PURCHASE]: nftPurchaseQueue,
    [TaskType.YIELD_OPTIMIZATION]: yieldOptimizationQueue,
    [TaskType.CLAIM_REWARDS]: rewardClaimQueue,
};

// Initialize workers
export function initializeWorkers() {
    // DAO Vote Worker
    const daoVoteWorker = new Worker(
        QueueName.DAO_VOTE,
        async (job) => {
            logger.info(`Processing DAO vote task: ${job.id}`);
            return await processDaoVoteTask(job.data);
        },
        { connection: redisSubscriber, concurrency: 5 }
    );

    // Token Purchase Worker
    const tokenPurchaseWorker = new Worker(
        QueueName.TOKEN_PURCHASE,
        async (job) => {
            logger.info(`Processing token purchase task: ${job.id}`);
            return await processTokenPurchaseTask(job.data);
        },
        { connection: redisSubscriber, concurrency: 5 }
    );

    // Token Swap Worker
    const tokenSwapWorker = new Worker(
        QueueName.TOKEN_SWAP,
        async (job) => {
            logger.info(`Processing token swap task: ${job.id}`);
            return await processTokenSwapTask(job.data);
        },
        { connection: redisSubscriber, concurrency: 5 }
    );

    // Staking Worker
    const stakingWorker = new Worker(
        QueueName.STAKING,
        async (job) => {
            logger.info(`Processing staking task: ${job.id}`);
            return await processStakingTask(job.data);
        },
        { connection: redisSubscriber, concurrency: 5 }
    );

    // Liquidity Worker
    const liquidityWorker = new Worker(
        QueueName.LIQUIDITY,
        async (job) => {
            logger.info(`Processing liquidity task: ${job.id}`);
            return await processLiquidityTask(job.data);
        },
        { connection: redisSubscriber, concurrency: 5 }
    );

    // NFT Purchase Worker
    const nftPurchaseWorker = new Worker(
        QueueName.NFT_PURCHASE,
        async (job) => {
            logger.info(`Processing NFT purchase task: ${job.id}`);
            return await processNftPurchaseTask(job.data);
        },
        { connection: redisSubscriber, concurrency: 5 }
    );

    // Yield Optimization Worker
    const yieldOptimizationWorker = new Worker(
        QueueName.YIELD_OPTIMIZATION,
        async (job) => {
            logger.info(`Processing yield optimization task: ${job.id}`);
            return await processYieldOptimizationTask(job.data);
        },
        { connection: redisSubscriber, concurrency: 5 }
    );

    // Reward Claim Worker
    const rewardClaimWorker = new Worker(
        QueueName.REWARD_CLAIM,
        async (job) => {
            logger.info(`Processing reward claim task: ${job.id}`);
            return await processRewardClaimTask(job.data);
        },
        { connection: redisSubscriber, concurrency: 5 }
    );

    // Set up error handlers for workers
    const workers = [
        daoVoteWorker,
        tokenPurchaseWorker,
        tokenSwapWorker,
        stakingWorker,
        liquidityWorker,
        nftPurchaseWorker,
        yieldOptimizationWorker,
        rewardClaimWorker,
    ];

    for (const worker of workers) {
        worker.on('error', err => {
            logger.error(`Worker error: ${err}`);
        });

        worker.on('failed', (job, err) => {
            logger.error(`Job ${job?.id} failed: ${err.message}`);
        });

        worker.on('completed', job => {
            logger.info(`Job ${job.id} completed successfully`);
        });
    }

    logger.info('All workers initialized');

    return workers;
}

// Initialize queue events
export function initializeQueueEvents() {
    const queueEvents = Object.values(QueueName).map(queueName => {
        const events = new QueueEvents(queueName, { connection: redisSubscriber });

        events.on('error', err => {
            logger.error(`Queue ${queueName} error: ${err}`);
        });

        return events;
    });

    logger.info('All queue events initialized');

    return queueEvents;
}

// Initialize all queues
export function initializeQueues() {
    const workers = initializeWorkers();
    const queueEvents = initializeQueueEvents();

    logger.info('All queues initialized');

    return { workers, queueEvents };
}

// Add a task to the appropriate queue
export async function enqueueTask(taskType: TaskType, data: any, options: any = {}) {
    const queue = taskQueueMap[taskType];

    if (!queue) {
        throw new Error(`No queue found for task type: ${taskType}`);
    }

    return queue.add(`task-${data.taskId}`, data, options);
}

/**
 * Get queue status
 * @returns Status of all task queues
 */
export async function getQueueStatus(): Promise<Record<string, QueueStats>> {


    // Initialize with correct type annotation
    const status: Record<string, QueueStats> = {};

    for (const [taskType, queue] of Object.entries(taskQueueMap)) {
        const [waiting, active, completed, failed] = await Promise.all([
            queue.getWaitingCount(),
            queue.getActiveCount(),
            queue.getCompletedCount(),
            queue.getFailedCount(),
        ]);

        status[taskType] = {
            waiting,
            active,
            completed,
            failed,
        };
    }

    return status;
}