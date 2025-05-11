import mongoose, { Document, Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

// API key status
export enum ApiKeyStatus {
    ACTIVE = 'active',
    REVOKED = 'revoked',
    EXPIRED = 'expired',
}

// Permission scopes for API keys
export enum ApiKeyScope {
    READ = 'read',
    WRITE = 'write',
    EXECUTE = 'execute',
    ADMIN = 'admin',
}

// API key document interface
export interface IApiKey extends Document {
    keyId: string;
    name: string;
    key: string;
    userId?: string;
    serviceId?: string;
    status: ApiKeyStatus;
    scopes: ApiKeyScope[];
    createdAt: Date;
    updatedAt: Date;
    expiresAt?: Date;
    lastUsed?: Date;
    ipWhitelist?: string[];
    rateLimits?: {
        requestsPerMinute: number;
        requestsPerHour: number;
        requestsPerDay: number;
    };
    metadata: Record<string, any>;
}

// API key schema
const apiKeySchema: Schema = new Schema(
    {
        keyId: {
            type: String,
            default: () => `key_${uuidv4()}`,
            required: true,
            unique: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        key: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        userId: {
            type: String,
            sparse: true,
            index: true,
        },
        serviceId: {
            type: String,
            sparse: true,
            index: true,
        },
        status: {
            type: String,
            enum: Object.values(ApiKeyStatus),
            default: ApiKeyStatus.ACTIVE,
            index: true,
        },
        scopes: [{
            type: String,
            enum: Object.values(ApiKeyScope),
            required: true,
        }],
        expiresAt: {
            type: Date,
            index: true,
        },
        lastUsed: {
            type: Date,
        },
        ipWhitelist: [{
            type: String,
        }],
        rateLimits: {
            requestsPerMinute: {
                type: Number,
                default: 60,
            },
            requestsPerHour: {
                type: Number,
                default: 1000,
            },
            requestsPerDay: {
                type: Number,
                default: 10000,
            }
        },
        metadata: {
            type: Map,
            of: Schema.Types.Mixed,
            default: {},
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
                // Hide the actual key in responses
                delete ret.key;
                return ret;
            },
        },
        toObject: {
            virtuals: true,
        },
    }
);

// Static method to generate a new API key
apiKeySchema.statics.generateApiKey = function (name: string, userId?: string, serviceId?: string, options: any = {}) {
    // Generate a secure random API key
    const key = `sk_${crypto.randomBytes(24).toString('hex')}`;

    // Calculate expiry date if provided
    let expiresAt;
    if (options.expiryDays) {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + options.expiryDays);
    }

    return this.create({
        name,
        key,
        userId,
        serviceId,
        scopes: options.scopes || [ApiKeyScope.READ],
        expiresAt,
        ipWhitelist: options.ipWhitelist || [],
        rateLimits: options.rateLimits,
        metadata: options.metadata || {},
    });
};

// Method to check if API key is valid
apiKeySchema.methods.isValid = function () {
    // Check if key is active
    if (this.status !== ApiKeyStatus.ACTIVE) {
        return false;
    }

    // Check if key is expired
    if (this.expiresAt && new Date(this.expiresAt) < new Date()) {
        return false;
    }

    return true;
};

// Method to check if IP is allowed
apiKeySchema.methods.isIpAllowed = function (ip: string) {
    // If no whitelist is defined, all IPs are allowed
    if (!this.ipWhitelist || this.ipWhitelist.length === 0) {
        return true;
    }

    return this.ipWhitelist.includes(ip);
};

// Method to update last used timestamp
apiKeySchema.methods.updateLastUsed = async function () {
    this.lastUsed = new Date();
    return this.save();
};

// Create and export the model
const ApiKey = mongoose.model<IApiKey>('ApiKey', apiKeySchema);
export default ApiKey;