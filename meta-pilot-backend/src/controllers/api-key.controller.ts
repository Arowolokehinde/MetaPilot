import { Request, Response } from 'express';
import { BadRequestError, NotFoundError, ForbiddenError } from '../utils/errors';
import { asyncHandler } from '../middlewares/error.middleware';
import {
    createApiKey,
    getUserApiKeys,
    getServiceApiKeys,
    revokeApiKey,
    updateApiKey
} from '../services/apikey.service';
import { ApiKeyScope } from '../models/apikey.model';
import { logger } from '../config/logger.config';

/**
 * Create a new API key
 * @route POST /api/v1/api-keys
 */
export const createApiKeyHandler = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
        if (!req.user) {
            throw new ForbiddenError('Authentication required');
        }

        const {
            name,
            serviceId,
            scopes = [ApiKeyScope.READ],
            expiryDays,
            ipWhitelist,
            rateLimits,
            metadata
        } = req.body;

        // Validate required fields
        if (!name) {
            throw new BadRequestError('API key name is required');
        }

        // Validate scopes
        if (!Array.isArray(scopes) || scopes.length === 0) {
            throw new BadRequestError('At least one scope is required');
        }

        // Validate that all scopes are valid
        const validScopes = Object.values(ApiKeyScope);
        for (const scope of scopes) {
            if (!validScopes.includes(scope as ApiKeyScope)) {
                throw new BadRequestError(`Invalid scope: ${scope}`);
            }
        }

        // Create options object
        const options = {
            scopes,
            expiryDays,
            ipWhitelist,
            rateLimits,
            metadata: {
                ...metadata,
                createdFrom: {
                    ip: req.ip,
                    userAgent: req.headers['user-agent'],
                },
            },
        };

        // Create the API key
        const apiKey = await createApiKey(name, req.user.userId, serviceId, options);

        logger.info(`API key created: ${apiKey.keyId}`, {
            userId: req.user.userId,
            keyId: apiKey.keyId,
            name: apiKey.name,
        });

        res.status(201).json({
            status: 'success',
            data: apiKey,
        });
    }
);

/**
 * Get all API keys for current user
 * @route GET /api/v1/api-keys
 */
export const getUserApiKeysHandler = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
        if (!req.user) {
            throw new ForbiddenError('Authentication required');
        }

        // Get API keys for user
        const apiKeys = await getUserApiKeys(req.user.userId);

        res.status(200).json({
            status: 'success',
            data: {
                apiKeys,
            },
        });
    }
);

/**
 * Get API keys for a service
 * @route GET /api/v1/api-keys/service/:serviceId
 */
export const getServiceApiKeysHandler = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
        if (!req.user) {
            throw new ForbiddenError('Authentication required');
        }

        const { serviceId } = req.params;

        // Get API keys for service
        const apiKeys = await getServiceApiKeys(serviceId);

        res.status(200).json({
            status: 'success',
            data: {
                apiKeys,
            },
        });
    }
);

/**
 * Revoke an API key
 * @route DELETE /api/v1/api-keys/:keyId
 */
export const revokeApiKeyHandler = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
        if (!req.user) {
            throw new ForbiddenError('Authentication required');
        }

        const { keyId } = req.params;

        // Revoke the API key
        const success = await revokeApiKey(keyId, req.user.userId);

        if (!success) {
            throw new NotFoundError('API key not found');
        }

        logger.info(`API key revoked: ${keyId}`, {
            userId: req.user.userId,
            keyId,
        });

        res.status(200).json({
            status: 'success',
            message: 'API key revoked successfully',
        });
    }
);

/**
 * Update API key
 * @route PATCH /api/v1/api-keys/:keyId
 */
export const updateApiKeyHandler = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
        if (!req.user) {
            throw new ForbiddenError('Authentication required');
        }

        const { keyId } = req.params;
        const { name, scopes, ipWhitelist, rateLimits, expiresAt, metadata } = req.body;

        // Validate scopes if provided
        if (scopes) {
            if (!Array.isArray(scopes) || scopes.length === 0) {
                throw new BadRequestError('At least one scope is required');
            }

            // Validate that all scopes are valid
            const validScopes = Object.values(ApiKeyScope);
            for (const scope of scopes) {
                if (!validScopes.includes(scope as ApiKeyScope)) {
                    throw new BadRequestError(`Invalid scope: ${scope}`);
                }
            }
        }

        // Update the API key
        const apiKey = await updateApiKey(keyId, {
            name,
            scopes: scopes as ApiKeyScope[],
            ipWhitelist,
            rateLimits,
            expiresAt: expiresAt ? new Date(expiresAt) : undefined,
            metadata,
        });

        logger.info(`API key updated: ${keyId}`, {
            userId: req.user.userId,
            keyId,
        });

        res.status(200).json({
            status: 'success',
            data: {
                apiKey,
            },
        });
    }
);

/**
 * Verify current API key
 * @route GET /api/v1/api-keys/verify
 */
export const verifyApiKeyHandler = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
        if (!req.apiKey) {
            throw new ForbiddenError('API key authentication required');
        }

        res.status(200).json({
            status: 'success',
            data: {
                keyId: req.apiKey.keyId,
                name: req.apiKey.name,
                userId: req.apiKey.userId,
                serviceId: req.apiKey.serviceId,
                scopes: req.apiKey.scopes,
            },
        });
    }
);