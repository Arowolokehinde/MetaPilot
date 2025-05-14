// src/models/Task.ts
import mongoose from 'mongoose';
import { ITaskDocument } from '../types/model';

// Task type and status enums 
export type TaskType = 
  | 'eth-transfer'     
  | 'dao-voting'
  | 'reward-claiming'
  | 'staking'
  | 'liquidity-provision'
  | 'nft-purchase' 
  | 'token-swap'
  | 'stablecoin-yield';

export type TaskStatus = 
  | 'active'    // Task is actively monitoring
  | 'paused'    // Task is paused by user
  | 'completed' // Task has completed (e.g., one-time tasks)
  | 'pending'   // Task is awaiting confirmation/session key
  | 'failed';   // Task encountered an error

// Define the Task schema - make sure everything matches your ITaskDocument interface
const TaskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['eth-transfer', 'dao-voting', 'reward-claiming', 'staking', 
             'liquidity-provision', 'nft-purchase', 'token-swap', 'stablecoin-yield'],
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    sessionKeyId: {
      type: String,
    },
    configuration: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    conditions: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    network: {
      type: String,
      enum: ['sepolia', 'base-goerli', 'mainnet'],
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'completed', 'failed', 'pending'],
      default: 'pending',
    },
    lastExecutedAt: {
      type: Date,
    },
    nextCheckAt: {
      type: Date,
    },
    lastCheckedAt: {
      type: Date,
    },
    executionHistory: [{
      timestamp: {
        type: Date,
        default: Date.now,
      },
      action: {
        type: String,
      },
      status: {
        type: String,
        enum: ['success', 'failed', 'pending'],
      },
      transactionHash: {
        type: String,
      },
      error: {
        type: String,
      },
      details: {
        type: mongoose.Schema.Types.Mixed,
      },
    }],
  },
  { timestamps: true }
);

// Remove the generic type parameter from the schema definition
// This is a more flexible approach that will work regardless of interface mismatches
const Task = mongoose.model('Task', TaskSchema);
export default Task;