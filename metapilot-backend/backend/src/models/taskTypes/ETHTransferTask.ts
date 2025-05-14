import { Schema } from 'mongoose';
import { ICreateETHTransferTaskParams } from '../../types/model';


// Schema for ETH transfer task configuration
export const ETHTransferConfigSchema = new Schema(
  {
    // Recipient address
    recipientAddress: {
      type: String,
      required: true,
      lowercase: true,
    },
    // Amount to transfer
    amount: {
      type: String, // Store as string to handle large numbers
      required: true,
    },
    // Transaction settings
    gasSettings: {
      maxGasPrice: {
        type: String,
      },
      priorityFee: {
        type: String,
      },
    },
    // Natural language rule (optional)
    transferRule: {
      type: String,
    },
    // Time constraints
    expiresAt: {
      type: Date,
    },
    // For one-time or recurring
    executionType: {
      type: String,
      enum: ['one-time', 'recurring'],
      default: 'one-time',
    },
    // For recurring transfers
    recurringSettings: {
      frequency: {
        type: String,
        enum: ['hourly', 'daily', 'weekly'],
      },
      dayOfWeek: {
        type: Number, // 0-6, Sunday to Saturday
      },
      hourOfDay: {
        type: Number, // 0-23
      },
    },
  },
  { _id: false }
);

// Schema for ETH transfer conditions
export const ETHTransferConditionSchema = new Schema(
  {
    // Condition type
    conditionType: {
      type: String,
      enum: ['price_threshold', 'time_based', 'balance_threshold', 'gas_price'],
      required: true,
    },
    // For ETH price threshold
    priceCondition: {
      type: {
        type: String,
        enum: ['above', 'below'],
      },
      priceThreshold: {
        type: String, // Store as string for precision
      },
      // Reference price when the task was created
      referencePrice: {
        type: String, // Store as string for precision
      },
    },
    // For balance threshold
    balanceCondition: {
      type: {
        type: String,
        enum: ['above', 'below'],
      },
      balanceThreshold: {
        type: String,
      },
    },
    // For gas price condition
    gasPriceCondition: {
      type: {
        type: String,
        enum: ['below'],
      },
      gasPriceThreshold: {
        type: String,
      },
    },
    // For time-based transfers
    frequency: {
      type: String,
      enum: ['hourly', 'daily', 'weekly'],
    },
    // Price source
    priceSource: {
      type: String,
      enum: ['coingecko', 'chainlink', 'custom'],
      default: 'coingecko',
    },
    // Allow repeated executions for the same condition?
    allowRepeatedExecution: {
      type: Boolean,
      default: false,
    },
    // Cooldown period between executions
    cooldownPeriod: {
      type: Number, // in minutes
      default: 60,
    },
  },
  { _id: false }
);

/**
 * Creates an ETH transfer task configuration
 */
export function createETHTransferTask(params: ICreateETHTransferTaskParams) {
  const {
    userId,
    name,
    description,
    sessionKeyId,
    configuration,
    conditions,
    network,
    status,
  } = params;

  return {
    userId,
    type: 'eth-transfer',
    name,
    description,
    sessionKeyId,
    configuration: {
      transferRule: configuration.transferRule || null,
      recipient: configuration.recipient || null,
      amount: configuration.amount || null,
      ...configuration,
    },
    conditions,
    network,
    status,
    nextCheckAt: new Date(Date.now() + 60000), // Check in 1 minute
  };
}