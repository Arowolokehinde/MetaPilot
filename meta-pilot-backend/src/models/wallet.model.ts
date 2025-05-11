import mongoose, { Document, Schema } from 'mongoose';

// Session key information
export interface SessionKeyInfo {
    sessionKey: string;
    expiry: Date;
    permissions: string[];
    metadata: Record<string, any>;
}

// Wallet document interface
export interface IWallet extends Document {
    walletAddress: string;
    userId: string;
    chainIds: number[];
    sessionKeys: SessionKeyInfo[];
    lastConnected: Date;
    createdAt: Date;
    updatedAt: Date;
    ens?: string;
    isEOA: boolean; // Whether the wallet is an externally owned account
}

// Wallet schema
const walletSchema: Schema = new Schema(
    {
        walletAddress: {
            type: String,
            required: true,
            unique: true,
            index: true,
            lowercase: true,
        },
        userId: {
            type: String,
            required: true,
            index: true,
        },
        chainIds: [{
            type: Number,
            required: true,
        }],
        sessionKeys: [{
            sessionKey: {
                type: String,
                required: true,
            },
            expiry: {
                type: Date,
                required: true,
            },
            permissions: [{
                type: String,
            }],
            metadata: {
                type: Map,
                of: Schema.Types.Mixed,
                default: {},
            }
        }],
        lastConnected: {
            type: Date,
            default: Date.now,
        },
        ens: {
            type: String,
            index: true,
            sparse: true,
        },
        isEOA: {
            type: Boolean,
            default: true,
        },
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
walletSchema.index({ walletAddress: 1, userId: 1 });
walletSchema.index({ 'sessionKeys.sessionKey': 1 });

// Create and export the model
export default mongoose.model<IWallet>('Wallet', walletSchema);