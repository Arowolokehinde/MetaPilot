import mongoose, { Document, Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { TaskType } from './task.model';

// Activity types
export enum ActivityType {
    TASK_CREATED = 'task_created',
    TASK_UPDATED = 'task_updated',
    TASK_DELETED = 'task_deleted',
    TASK_EXECUTED = 'task_executed',
    WALLET_CONNECTED = 'wallet_connected',
    SESSION_CREATED = 'session_created',
    SETTINGS_UPDATED = 'settings_updated',
}

// Activity status
export enum ActivityStatus {
    SUCCESS = 'success',
    FAILED = 'failed',
    PENDING = 'pending',
}

// Activity document interface
export interface IActivity extends Document {
    activityId: string;
    userId: string;
    walletAddress: string;
    type: ActivityType;
    taskType?: TaskType;
    taskId?: string;
    status: ActivityStatus;
    details: string;
    metadata: Record<string, any>;
    timestamp: Date;
    txHash?: string;
    chainId?: number;
}

// Activity schema
const activitySchema: Schema = new Schema(
    {
        activityId: {
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
        type: {
            type: String,
            enum: Object.values(ActivityType),
            required: true,
            index: true,
        },
        taskType: {
            type: String,
            enum: Object.values(TaskType),
            index: true,
        },
        taskId: {
            type: String,
            index: true,
        },
        status: {
            type: String,
            enum: Object.values(ActivityStatus),
            required: true,
        },
        details: {
            type: String,
            required: true,
        },
        metadata: {
            type: Map,
            of: Schema.Types.Mixed,
            default: {},
        },
        timestamp: {
            type: Date,
            default: Date.now,
            required: true,
            index: true,
        },
        txHash: {
            type: String,
            index: true,
        },
        chainId: {
            type: Number,
        },
    },
    {
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
activitySchema.index({ userId: 1, timestamp: -1 });
activitySchema.index({ walletAddress: 1, timestamp: -1 });
activitySchema.index({ taskId: 1, timestamp: -1 });

// Create and export the model
export default mongoose.model<IActivity>('Activity', activitySchema);