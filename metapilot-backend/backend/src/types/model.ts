// src/types/models.ts

import mongoose from 'mongoose';

/**
 * User interfaces
 */
export interface IUser {
  address: string;             // Ethereum wallet address
  agentId?: string;            // ID of the AI agent for this user
  createdAt: Date;
  updatedAt: Date;
  delegations: Array<{        // ERC-7715 delegations
    sessionKeyAddress: string; // Session key public address
    privateKey?: string;       // Encrypted private key (optional, for managed keys)
    createdAt: Date;
    expiresAt: Date;
    permissions: {
      contractAddress: string;  // Target contract (e.g., DEX, DAO)
      functionSelectors: string[];  // Allowed function selectors (e.g., "swap(address,address,uint256)")
      tokenIds?: number[];  // For ERC-721/ERC-1155 if applicable
    }[];
    status: 'active' | 'expired' | 'revoked';
  }>;
  preferences: {
    notificationEmail?: string;
    notificationsEnabled: boolean;
    defaultGasPreference: 'low' | 'medium' | 'high';
    network: 'sepolia' | 'base-goerli' | 'mainnet'; // Default to testnet for MVP
  };
}

export interface IUserDocument extends mongoose.Document, IUser {
  _id: mongoose.Types.ObjectId;
}

/**
 * Task type and status enums
 */
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

/**
 * Task interfaces
 */
export interface ITask {
  userId: mongoose.Types.ObjectId;  // Reference to user
  type: TaskType;                   // Type of task - ADDED THIS FIELD
  name: string;                     // Task name
  description?: string;             // Optional description
  sessionKeyId?: string;            // Session key used for execution
  configuration: {                  // Task configuration
    transferRule?: string;          // Natural language rule (if applicable)
    recipient?: string;             // Recipient address for transfers
    amount?: string;                // Amount for transfers
    tokenAddress?: string;          // Token address for ERC20 transfers
    [key: string]: any;             // Additional configuration options
  };
  conditions: {                     // Execution conditions
    conditionType?: 'price_threshold' | 'balance_threshold' | 'gas_price' | 'time_based';
    thresholdType?: 'above' | 'below';
    priceThreshold?: number;
    balanceThreshold?: number;
    gasPriceThreshold?: number;
    frequency?: 'hourly' | 'daily' | 'weekly';
    [key: string]: any;             // Additional condition options
  };
  network: 'sepolia' | 'base-goerli' | 'mainnet';  // Blockchain network
  status: TaskStatus;                // Task status
  executionHistory?: Array<{        // History of executions
    timestamp: Date;
    action?: string;                // Added action field
    status: 'success' | 'failed' | 'pending';
    details?: Record<string, any>;
    transactionHash?: string;
    gasUsed?: number;
    error?: string;
  }>;
  lastCheckedAt?: Date;            // Last time conditions were checked
  lastExecutedAt?: Date;           // Last successful execution
  nextCheckAt?: Date;              // When to next check conditions
  createdAt?: Date;                // When the task was created
  updatedAt?: Date;                // When the task was last updated
}

export interface ITaskDocument extends mongoose.Document, ITask {
  _id: mongoose.Types.ObjectId;
}

/**
 * ETH Transfer Task
 */
export interface IETHTransferTask extends ITask {
  type: 'eth-transfer';            // Specify the type for ETH transfer tasks
  configuration: {
    transferRule?: string;         // Natural language rule
    recipient: string;             // Recipient address
    amount: string;                // ETH amount
    [key: string]: any;
  };
}

export interface IETHTransferTaskDocument extends mongoose.Document, IETHTransferTask {
  _id: mongoose.Types.ObjectId;
}

/**
 * Interface for ETH transfer task creation parameters
 */
export interface ICreateETHTransferTaskParams {
  userId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  sessionKeyId?: string;
  configuration: {
    transferRule?: string;
    recipient?: string;
    amount?: string;
    [key: string]: any;
  };
  conditions: Record<string, any>;
  network: string;
  status: string;
}

/**
 * Session Key Service interfaces
 */
export interface ISessionKey {
  address: string;          // Public address
  privateKey: string;       // Encrypted private key
  userId: mongoose.Types.ObjectId;
  expiresAt: Date;
  permissions: {
    contractAddress: string;
    functionSelectors: string[];
    tokenIds?: number[];
  }[];
  status: 'active' | 'expired' | 'revoked';
}

/**
 * Rule Processing interfaces
 */
export interface IRuleCondition {
  conditionType: 'price_threshold' | 'balance_threshold' | 'gas_price' | 'time_based';
  thresholdType?: 'above' | 'below';
  priceThreshold?: number;
  balanceThreshold?: number;
  gasPriceThreshold?: number;
  frequency?: 'hourly' | 'daily' | 'weekly';
  recipientAddress?: string;
  amount?: number;
  rationale?: string;
}

/**
 * AI Bridge Service interfaces
 */
export interface IAIAgentResponse {
  id: string;
  name: string;
  status: 'active' | 'inactive';
}

/**
 * Blockchain Service interfaces
 */
export interface ITransactionResult {
  txHash: string;
  status: 'success' | 'pending' | 'failed';
  blockNumber?: number;
  gasUsed?: number;
  effectiveGasPrice?: string;
  error?: string;
}