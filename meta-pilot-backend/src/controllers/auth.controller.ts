import { Request, Response, NextFunction } from 'express';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { ethers } from 'ethers';
import { v4 as uuidv4 } from 'uuid';
import { BadRequestError, UnauthorizedError } from '../utils/errors';
import { asyncHandler } from '../middlewares/error.middleware';
import env from '../config/env.config';
import User from '../models/user.model';
import Wallet from '../models/wallet.model';
import { ActivityType, ActivityStatus } from '../models/activity.model';
import { createActivity } from '../services/activity.service';

/**
 * Generate a nonce for wallet signing
 * @route POST /api/v1/auth/nonce
 */
export const generateNonce = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
        const { walletAddress } = req.body;

        if (!walletAddress) {
            throw new BadRequestError('Wallet address is required');
        }

        // Generate a random nonce
        const nonce = `MetaPilot Login: ${uuidv4()}`;

        // Find or create a user with this wallet address
        let user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });

        if (!user) {
            user = await User.create({
                walletAddress: walletAddress.toLowerCase(),
                userId: uuidv4(),
            });
        }

        // Update user with new nonce
        user.nonce = nonce;
        await user.save();

        res.status(200).json({
            status: 'success',
            data: {
                nonce,
            },
        });
    }
);

/**
 * Verify wallet signature and authenticate user
 * @route POST /api/v1/auth/verify
 */
export const verifySignature = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
        const { walletAddress, signature } = req.body;

        if (!walletAddress || !signature) {
            throw new BadRequestError('Wallet address and signature are required');
        }

        // Find user with this wallet address
        const user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });

        if (!user || !user.nonce) {
            throw new UnauthorizedError('Invalid request, please generate a nonce first');
        }

        try {
            // Verify signature
            const signerAddress = ethers.verifyMessage(user.nonce, signature);

            // Check if recovered address matches the provided address
            if (signerAddress.toLowerCase() !== walletAddress.toLowerCase()) {
                throw new UnauthorizedError('Invalid signature');
            }

            // Generate JWT token
            const token = jwt.sign(
                { userId: user.userId, walletAddress: user.walletAddress },
                env.JWT_SECRET as Secret,
                { expiresIn: env.JWT_EXPIRATION } as SignOptions
            );

            // Calculate expiry date
            const expiryDate = new Date();
            expiryDate.setHours(expiryDate.getHours() + 24); // Assuming JWT_EXPIRATION is '24h'

            // Update user data
            user.nonce = undefined; // Clear nonce after successful verification
            user.sessionKey = token;
            user.sessionExpiry = expiryDate;
            user.lastLogin = new Date();
            await user.save();

            // Create or update wallet in the Wallet collection
            const wallet = await Wallet.findOneAndUpdate(
                { walletAddress: walletAddress.toLowerCase() },
                {
                    userId: user.userId,
                    $push: {
                        sessionKeys: {
                            sessionKey: token,
                            expiry: expiryDate,
                            permissions: ['all'], // Default permission
                            metadata: {
                                createdAt: new Date(),
                                userAgent: req.headers['user-agent'],
                                ip: req.ip,
                            },
                        },
                    },
                    lastConnected: new Date(),
                },
                { upsert: true, new: true }
            );

            // Log activity
            await createActivity({
                userId: user.userId,
                walletAddress: user.walletAddress,
                type: ActivityType.WALLET_CONNECTED,
                status: ActivityStatus.SUCCESS,
                details: 'Wallet connected successfully',
                metadata: {
                    userAgent: req.headers['user-agent'],
                    ip: req.ip,
                },
            });

            res.status(200).json({
                status: 'success',
                data: {
                    token,
                    expiresIn: env.JWT_EXPIRATION,
                    user: {
                        userId: user.userId,
                        walletAddress: user.walletAddress,
                    },
                },
            });
        } catch (error) {
            throw new UnauthorizedError('Invalid signature');
        }
    }
);

/**
 * Get current user profile
 * @route GET /api/v1/auth/me
 */
export const getCurrentUser = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
        if (!req.user) {
            throw new UnauthorizedError('Authentication required');
        }

        res.status(200).json({
            status: 'success',
            data: {
                user: req.user,
            },
        });
    }
);

/**
 * Logout user
 * @route POST /api/v1/auth/logout
 */
export const logout = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
        if (!req.user) {
            throw new UnauthorizedError('Authentication required');
        }

        // Clear session key
        const user = req.user;
        user.sessionKey = undefined;
        user.sessionExpiry = undefined;
        await user.save();

        // Update wallet collection
        await Wallet.updateMany(
            { userId: user.userId },
            {
                $pull: {
                    sessionKeys: { sessionKey: req.headers.authorization?.split(' ')[1] },
                },
            }
        );

        // Log activity
        await createActivity({
            userId: user.userId,
            walletAddress: user.walletAddress,
            type: ActivityType.SESSION_CREATED,
            status: ActivityStatus.SUCCESS,
            details: 'User logged out successfully',
        });

        res.status(200).json({
            status: 'success',
            message: 'Logged out successfully',
        });
    }
);

/**
 * Generate a DTK session key
 * @route POST /api/v1/auth/session-key
 */
export const generateSessionKey = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
        if (!req.user) {
            throw new UnauthorizedError('Authentication required');
        }

        const { permissions, expiration } = req.body;

        // Generate a unique session key
        const sessionKey = `sk-${uuidv4()}`;

        // Calculate expiry date (default: 7 days)
        const expiryDate = new Date();
        const daysToAdd = expiration ? parseInt(expiration) : 7;
        expiryDate.setDate(expiryDate.getDate() + daysToAdd);

        // Update wallet with session key
        const wallet = await Wallet.findOneAndUpdate(
            { walletAddress: req.user.walletAddress },
            {
                $push: {
                    sessionKeys: {
                        sessionKey,
                        expiry: expiryDate,
                        permissions: permissions || ['all'],
                        metadata: {
                            createdAt: new Date(),
                            createdBy: 'user',
                            userAgent: req.headers['user-agent'],
                            ip: req.ip,
                        },
                    },
                },
            },
            { new: true }
        );

        if (!wallet) {
            throw new BadRequestError('Wallet not found');
        }

        // Log activity
        await createActivity({
            userId: req.user.userId,
            walletAddress: req.user.walletAddress,
            type: ActivityType.SESSION_CREATED,
            status: ActivityStatus.SUCCESS,
            details: 'Session key generated',
            metadata: {
                sessionKey,
                expiry: expiryDate,
                permissions,
            },
        });

        res.status(201).json({
            status: 'success',
            data: {
                sessionKey,
                expiry: expiryDate,
                permissions: permissions || ['all'],
            },
        });
    }
);

/**
 * Revoke a session key
 * @route DELETE /api/v1/auth/session-key/:sessionKey
 */
export const revokeSessionKey = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
        if (!req.user) {
            throw new UnauthorizedError('Authentication required');
        }

        const { sessionKey } = req.params;

        // Remove session key from wallet
        const wallet = await Wallet.findOneAndUpdate(
            {
                walletAddress: req.user.walletAddress,
                'sessionKeys.sessionKey': sessionKey
            },
            {
                $pull: {
                    sessionKeys: { sessionKey },
                },
            },
            { new: true }
        );

        if (!wallet) {
            throw new BadRequestError('Session key not found');
        }

        // Log activity
        await createActivity({
            userId: req.user.userId,
            walletAddress: req.user.walletAddress,
            type: ActivityType.SESSION_CREATED,
            status: ActivityStatus.SUCCESS,
            details: 'Session key revoked',
            metadata: {
                sessionKey,
            },
        });

        res.status(200).json({
            status: 'success',
            message: 'Session key revoked successfully',
        });
    }
);

/**
 * List all session keys for a wallet
 * @route GET /api/v1/auth/session-keys
 */
export const listSessionKeys = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
        if (!req.user) {
            throw new UnauthorizedError('Authentication required');
        }

        // Get wallet with session keys
        const wallet = await Wallet.findOne({ walletAddress: req.user.walletAddress });

        if (!wallet) {
            throw new BadRequestError('Wallet not found');
        }

        // Filter out expired session keys
        const activeSessionKeys = wallet.sessionKeys.filter(
            (key) => key.expiry > new Date()
        );

        res.status(200).json({
            status: 'success',
            data: {
                sessionKeys: activeSessionKeys,
            },
        });
    }
);