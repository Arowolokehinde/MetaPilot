// src/models/User.ts
import mongoose from 'mongoose';
import { IUserDocument } from '../types/model';
// Define schema only once
const UserSchema = new mongoose.Schema<IUserDocument>(
  {
    address: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    agentId: {
      type: String,
    },
    delegations: [{
      sessionKeyAddress: {
        type: String,
        required: true,
      },
      privateKey: {
        type: String,
        select: false,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
      expiresAt: {
        type: Date,
        required: true,
      },
      permissions: [{
        contractAddress: {
          type: String,
          required: true,
          lowercase: true,
        },
        functionSelectors: [{
          type: String,
          required: true,
        }],
        tokenIds: [{
          type: Number,
        }],
      }],
      status: {
        type: String,
        enum: ['active', 'expired', 'revoked'],
        default: 'active',
      },
    }],
    preferences: {
      notificationEmail: {
        type: String,
      },
      notificationsEnabled: {
        type: Boolean,
        default: true,
      },
      defaultGasPreference: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium',
      },
      network: {
        type: String,
        enum: ['sepolia', 'base-goerli', 'mainnet'],
        default: 'sepolia',
      },
    },
  },
  { timestamps: true }
);

// Export model
const User = mongoose.model<IUserDocument>('User', UserSchema);
export default User;