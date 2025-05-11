import { logger } from '../config/logger.config';
import ApiKey, { ApiKeyScope, ApiKeyStatus } from '../models/apikey.model';
import RateLimit from '../utils/rate-limit';

// Cache to store rate limit information
const rateLimitCache = new RateLimit({
    windowMs: 60000, // 1 minute window 
    max: 100 // Default max requests per window
});

/**
 * Validate an API key
 */
export async function validateApiKey(key: string, ip: string): Promise<any> {
    try {
        // Find the API key
        const apiKey = await ApiKey.findOne({ key });

        if (!apiKey) {
            logger.warn(`Invalid API key attempt from IP: ${ip}`);
            return {
                valid: false,
                reason: 'invalid_key'
            };
        }

        // Check if API key is valid
        if (!apiKey.isValid()) {
            logger.warn(`Attempt to use invalid API key ${apiKey.keyId} from IP: ${ip}`);
            return {
                valid: false,
                reason: apiKey.status === ApiKeyStatus.REVOKED ? 'revoked' : 'expired',
                keyId: apiKey.keyId
            };
        }

        // Check IP whitelist if configured
        if (!apiKey.isIpAllowed(ip)) {
            logger.warn(`IP not allowed for API key ${apiKey.keyId}: ${ip}`);
            return {
                valid: false,
                reason: 'ip_restricted',
                keyId: apiKey.keyId
            };
        }

        // Check rate limits
        const rateLimits = apiKey.rateLimits || {
            requestsPerMinute: 60,
            requestsPerHour: 1000,
            requestsPerDay: 10000
        };

        // Check minute rate limit
        const minuteRateKey = `${apiKey.keyId}_minute`;
        const minuteLimitExceeded = await rateLimitCache.increment(minuteRateKey, 60, rateLimits.requestsPerMinute);
        if (minuteLimitExceeded) {
            logger.warn(`Rate limit exceeded for API key ${apiKey.keyId} (minute limit)`);
            return {
                valid: false,
                reason: 'rate_limit_exceeded',
                keyId: apiKey.keyId,
                retryAfter: rateLimitCache.getRetryAfter(minuteRateKey)
            };
        }

        // Update last used timestamp (but don't await to avoid blocking)
        apiKey.updateLastUsed().catch(err => {
            logger.error(`Error updating last used for API key ${apiKey.keyId}:`, err);
        });

        // Return API key info
        return {
            valid: true,
            keyId: apiKey.keyId,
            userId: apiKey.userId,
            serviceId: apiKey.serviceId,
            scopes: apiKey.scopes,
            name: apiKey.name,
            metadata: apiKey.metadata
        };
    } catch (error) {
        logger.error(`Error validating API key:`, error);
        return {
            valid: false,
            reason: 'server_error'
        };
    }
}

/**
 * Create a new API key
 */
export async function createApiKey(
    name: string,
    userId?: string,
    serviceId?: string,
    options: any = {}
): Promise<any> {
    try {
        // Generate new API key
        const apiKey = await ApiKey.generateApiKey(name, userId, serviceId, options);

        // Return the key details (including the actual key - this is the only time the key will be visible)
        return {
            keyId: apiKey.keyId,
            name: apiKey.name,
            key: apiKey.key, // Return the actual key only on creation
            userId: apiKey.userId,
            serviceId: apiKey.serviceId,
            scopes: apiKey.scopes,
            expiresAt: apiKey.expiresAt,
            createdAt: apiKey.createdAt,
        };
    } catch (error: any) {
        logger.error(`Error creating API key:`, error);
        throw new Error(`Failed to create API key: ${error.message}`);
    }
}

/**
 * Get API keys for a user
 */
export async function getUserApiKeys(userId: string): Promise<any[]> {
    try {
        // Find all active API keys for this user
        const apiKeys = await ApiKey.find({ userId, status: ApiKeyStatus.ACTIVE });

        return apiKeys;
    } catch (error: any) {
        logger.error(`Error getting API keys for user ${userId}:`, error);
        throw new Error(`Failed to get API keys: ${error.message}`);
    }
}

/**
 * Get API keys for a service
 */
export async function getServiceApiKeys(serviceId: string): Promise<any[]> {
    try {
        // Find all active API keys for this service
        const apiKeys = await ApiKey.find({ serviceId, status: ApiKeyStatus.ACTIVE });

        return apiKeys;
    } catch (error: any) {
        logger.error(`Error getting API keys for service ${serviceId}:`, error);
        throw new Error(`Failed to get API keys: ${error.message}`);
    }
}

/**
 * Revoke an API key
 */
export async function revokeApiKey(keyId: string, userId?: string): Promise<boolean> {
    try {
        // Find the API key, optionally filtering by userId
        const query: any = { keyId };
        if (userId) {
            query.userId = userId;
        }

        const apiKey = await ApiKey.findOne(query);

        if (!apiKey) {
            throw new Error(`API key not found`);
        }

        // Revoke the key
        apiKey.status = ApiKeyStatus.REVOKED;
        await apiKey.save();

        // Clear from rate limit cache
        rateLimitCache.clear(`${keyId}_minute`);

        return true;
    } catch (error: any) {
        logger.error(`Error revoking API key ${keyId}:`, error);
        throw new Error(`Failed to revoke API key: ${error.message}`);
    }
}

/**
 * Update API key scopes or settings
 */
export async function updateApiKey(
    keyId: string,
    updates: {
        name?: string,
        scopes?: ApiKeyScope[],
        ipWhitelist?: string[],
        rateLimits?: {
            requestsPerMinute?: number,
            requestsPerHour?: number,
            requestsPerDay?: number,
        },
        expiresAt?: Date,
        metadata?: Record<string, any>
    }
): Promise<any> {
    try {
        // Find the API key
        const apiKey = await ApiKey.findOne({ keyId });

        if (!apiKey) {
            throw new Error(`API key not found`);
        }

        // Update fields
        if (updates.name) apiKey.name = updates.name;
        if (updates.scopes) apiKey.scopes = updates.scopes;
        if (updates.ipWhitelist) apiKey.ipWhitelist = updates.ipWhitelist;
        if (updates.rateLimits) {
            apiKey.rateLimits = {
                ...apiKey.rateLimits,
                ...updates.rateLimits
            };
        }
        if (updates.expiresAt) apiKey.expiresAt = updates.expiresAt;
        if (updates.metadata) {
            apiKey.metadata = {
                ...apiKey.metadata,
                ...updates.metadata
            };
        }

        await apiKey.save();

        return apiKey;
    } catch (error: any) {
        logger.error(`Error updating API key ${keyId}:`, error);
        throw new Error(`Failed to update API key: ${error.message}`);
    }
}

/**
 * Check if an API key has a specific scope
 */
export function hasScope(apiKey: any, requiredScope: ApiKeyScope): boolean {
    // Check if the API key has the ADMIN scope (which grants all permissions)
    if (apiKey.scopes.includes(ApiKeyScope.ADMIN)) {
        return true;
    }

    // Check if the API key has the specific required scope
    return apiKey.scopes.includes(requiredScope);
}