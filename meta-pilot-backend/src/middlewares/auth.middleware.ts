import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { asyncHandler } from './error.middleware';
import env from '../config/env.config';
import User from '../models/user.model';
import Wallet from '../models/wallet.model';
import { validateApiKey } from '../services/apikey.service';
import { ApiKeyScope } from '../models/apikey.model';
import { logger } from '../config/logger.config';

// Extend Express Request interface to include user property
declare global {
    namespace Express {
        interface Request {
            user?: any;
            wallet?: any;
            apiKey?: any;
        }
    }
}

/**
 * Middleware to verify JWT token and authenticate user
 */
export const authenticate = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        // Get token from header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedError('Authentication required');
        }

        // Extract token
        const token = authHeader.split(' ')[1];

        try {
            // Verify token
            const decoded = jwt.verify(token, env.JWT_SECRET) as any;

            // Check if user exists
            const user = await User.findOne({ userId: decoded.userId });
            if (!user) {
                throw new UnauthorizedError('User not found');
            }

            // Check if token is expired based on our database
            if (user.sessionExpiry && new Date(user.sessionExpiry) < new Date()) {
                throw new UnauthorizedError('Session expired');
            }

            // Attach user to request
            req.user = user;

            next();
        } catch (error: any) {
            if (error.name === 'JsonWebTokenError') {
                throw new UnauthorizedError('Invalid token');
            } else if (error.name === 'TokenExpiredError') {
                throw new UnauthorizedError('Token expired');
            }
            throw error;
        }
    }
);

/**
 * Middleware to verify API key for Gaia and other automated services
 */
export const authenticateApiKey = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        // Get API key from header
        const apiKey = req.headers['x-api-key'] as string;
        if (!apiKey) {
            throw new UnauthorizedError('API key required');
        }

        // Get client IP address for validation
        const clientIp = req.ip ||
            req.headers['x-forwarded-for'] as string ||
            req.socket.remoteAddress ||
            'unknown';

        // Validate the API key
        const apiKeyData = await validateApiKey(apiKey, clientIp);

        if (!apiKeyData.valid) {
            let message = 'Invalid API key';

            // Provide more specific error messages based on the reason
            switch (apiKeyData.reason) {
                case 'revoked':
                    message = 'API key has been revoked';
                    break;
                case 'expired':
                    message = 'API key has expired';
                    break;
                case 'ip_restricted':
                    message = 'API key not authorized for this IP address';
                    break;
                case 'rate_limit_exceeded':
                    // Set retry-after header for rate limiting
                    res.set('Retry-After', apiKeyData.retryAfter.toString());
                    res.set('X-RateLimit-Reset', apiKeyData.retryAfter.toString());
                    message = 'Rate limit exceeded';
                    break;
            }

            logger.warn(`API key authentication failed: ${message}`, {
                reason: apiKeyData.reason,
                keyId: apiKeyData.keyId,
                ip: clientIp,
            });

            throw new UnauthorizedError(message);
        }

        // Attach API key data to request
        req.apiKey = apiKeyData;

        // If the API key is associated with a user, also attach the user
        if (apiKeyData.userId) {
            const user = await User.findOne({ userId: apiKeyData.userId });
            if (user) {
                req.user = user;
            }
        }

        logger.debug(`API key authentication successful: ${apiKeyData.keyId}`, {
            keyId: apiKeyData.keyId,
            name: apiKeyData.name,
            scopes: apiKeyData.scopes,
            serviceId: apiKeyData.serviceId,
        });

        next();
    }
);

/**
 * Middleware to require specific API key scope
 */
export const requireApiKeyScope = (requiredScope: ApiKeyScope) => {
    return asyncHandler(
        async (req: Request, res: Response, next: NextFunction): Promise<void> => {
            if (!req.apiKey) {
                throw new UnauthorizedError('API key authentication required');
            }

            // Check for admin scope (which grants all permissions)
            if (req.apiKey.scopes.includes(ApiKeyScope.ADMIN)) {
                return next();
            }

            // Check for the specific required scope
            if (!req.apiKey.scopes.includes(requiredScope)) {
                throw new ForbiddenError(`Required scope "${requiredScope}" not granted to this API key`);
            }

            next();
        }
    );
};

/**
 * Middleware to check if user owns the wallet
 */
export const verifyWalletOwnership = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        if (!req.user) {
            throw new UnauthorizedError('Authentication required');
        }

        const walletAddress = req.params.walletAddress || req.body.walletAddress;
        if (!walletAddress) {
            throw new UnauthorizedError('Wallet address required');
        }

        // Normalize wallet address
        const normalizedWalletAddress = walletAddress.toLowerCase();

        // Check if user owns the wallet
        const wallet = await Wallet.findOne({
            walletAddress: normalizedWalletAddress,
            userId: req.user.userId,
        });

        if (!wallet) {
            throw new ForbiddenError('You do not have access to this wallet');
        }

        // Attach wallet to request
        req.wallet = wallet;

        next();
    }
);

/**
 * Middleware to verify if session key is valid
 */
export const verifySessionKey = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        // Get session key from header
        const sessionKey = req.headers['x-session-key'] as string;
        if (!sessionKey) {
            throw new UnauthorizedError('Session key required');
        }

        // Find wallet with this session key
        const wallet = await Wallet.findOne({
            'sessionKeys.sessionKey': sessionKey,
        });

        if (!wallet) {
            throw new UnauthorizedError('Invalid session key');
        }

        // Find the specific session key
        const sessionKeyObj = wallet.sessionKeys.find(
            (sk) => sk.sessionKey === sessionKey
        );

        // Check if session key is expired
        if (!sessionKeyObj || sessionKeyObj.expiry < new Date()) {
            throw new UnauthorizedError('Session key expired or invalid');
        }

        // Get user
        const user = await User.findOne({ userId: wallet.userId });
        if (!user) {
            throw new UnauthorizedError('User not found');
        }

        // Attach user and wallet to request
        req.user = user;
        req.wallet = wallet;

        next();
    }
);