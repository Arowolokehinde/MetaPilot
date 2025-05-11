import mongoose, { Document, Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

// Task types
export enum TaskType {
    DAO_VOTE = 'dao_vote',
    CLAIM_REWARDS = 'claim_rewards',
    BUY_TOKEN = 'buy_token',
    LIQUIDITY_PROVISION = 'liquidity_provision',
    STAKING = 'staking',
    TOKEN_SWAP = 'token_swap',
    NFT_PURCHASE = 'nft_purchase',
    YIELD_OPTIMIZATION = 'yield_optimization',
}

// Task status
export enum TaskStatus {
    ACTIVE = 'active',
    PAUSED = 'paused',
    COMPLETED = 'completed',
    FAILED = 'failed',
    PENDING = 'pending',
}

// Task execution status
export enum ExecutionStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    SUCCESSFUL = 'successful',
    FAILED = 'failed',
    NO_ACTION = 'no_action', // When conditions not met
}

// Rules/conditions for task execution
export interface TaskRule {
    type: string;
    condition: string;
    parameters: Record<string, any>;
}

// Task execution history
export interface ExecutionRecord {
    timestamp: Date;
    status: ExecutionStatus;
    details?: string;
    txHash?: string;
    gasUsed?: number;
    errorMessage?: string;
}

// Task document interface
export interface ITask extends Document {
    taskId: string;
    userId: string;
    walletAddress: string;
    name: string;
    type: TaskType;
    status: TaskStatus;
    rules: TaskRule[];
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
    lastExecuted?: Date;
    nextScheduledExecution?: Date;
    executionHistory: ExecutionRecord[];
}

// Task schema
const taskSchema: Schema = new Schema(
    {
        taskId: {
            type: String,
            default: uuidv4,
            required: true,
            unique: true,
            index: true,
        },
        userId: {
            type: String,
            required: true,
            index: true,
        },
        walletAddress: {
            type: String,
            required: true,
            index: true,
            lowercase: true,
        },
        name: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: Object.values(TaskType),
            required: true,
            index: true,
        },
        status: {
            type: String,
            enum: Object.values(TaskStatus),
            default: TaskStatus.ACTIVE,
            index: true,
        },
        rules: [{
            type: {
                type: String,
                required: true,
            },
            condition: {
                type: String,
                required: true,
            },
            parameters: {
                type: Map,
                of: Schema.Types.Mixed,
                default: {},
            },
        }],
        metadata: {
            type: Map,
            of: Schema.Types.Mixed,
            default: {},
        },
        lastExecuted: {
            type: Date,
        },
        nextScheduledExecution: {
            type: Date,
            index: true,
        },
        executionHistory: [{
            timestamp: {
                type: Date,
                default: Date.now,
            },
            status: {
                type: String,
                enum: Object.values(ExecutionStatus),
                required: true,
            },
            details: String,
            txHash: String,
            gasUsed: Number,
            errorMessage: String,
        }],
    },
    {
        timestamps: true,

        // Add virtual properties to document
        toJSON: {
            virtuals: true,
            transform: (_, ret) => {
                delete ret._id;
                delete ret.__v;
                return ret;
            },
        },
        toObject: {
            virtuals: true,
        },
    }
);

// Add indexes for better performance
taskSchema.index({ userId: 1, type: 1 });
taskSchema.index({ status: 1, nextScheduledExecution: 1 });
taskSchema.index({ walletAddress: 1, status: 1 });

// Create and export the model
export default mongoose.model<ITask>('Task', taskSchema);