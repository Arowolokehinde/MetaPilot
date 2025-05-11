import mongoose, { Document, Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

// User document interface
export interface IUser extends Document {
    userId: string;
    walletAddress: string;
    nonce?: string;
    sessionKey?: string;
    sessionExpiry?: Date;
    createdAt: Date;
    updatedAt: Date;
    lastLogin?: Date;
    notificationPreferences: {
        email: boolean;
        inApp: boolean;
        pushNotifications: boolean;
    };
    email?: string;
    settings: {
        gasPreferences: {
            maxGasPrice?: number;
            priorityFee?: number;
            useFlashbots?: boolean;
        };
        defaultSlippage?: number;
    };
}

// User schema
const userSchema: Schema = new Schema(
    {
        userId: {
            type: String,
            default: uuidv4,
            required: true,
            unique: true,
            index: true,
        },
        walletAddress: {
            type: String,
            required: true,
            unique: true,
            index: true,
            lowercase: true,
        },

        nonce: {
            type: String,
        },

        sessionKey: {
            type: String,
            index: true,
        },
        sessionExpiry: {
            type: Date,
        },
        lastLogin: {
            type: Date,
        },
        notificationPreferences: {
            email: {
                type: Boolean,
                default: true,
            },
            inApp: {
                type: Boolean,
                default: true,
            },
            pushNotifications: {
                type: Boolean,
                default: false,
            },
        },
        email: {
            type: String,
            sparse: true,
            index: true,
            lowercase: true,
        },
        settings: {
            gasPreferences: {
                maxGasPrice: {
                    type: Number,
                },
                priorityFee: {
                    type: Number,
                },
                useFlashbots: {
                    type: Boolean,
                    default: false,
                },
            },
            defaultSlippage: {
                type: Number,
                default: 0.5, // 0.5%
            },
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

// Create and export the model
export default mongoose.model<IUser>('User', userSchema);