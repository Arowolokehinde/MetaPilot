import { Router } from 'express';
import {
    generateNonce,
    verifySignature,
    getCurrentUser,
    logout,
    generateSessionKey,
    revokeSessionKey,
    listSessionKeys
} from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validationSchemas, validate } from '../middlewares/validation.middleware';

const router = Router();

/**
 * @route POST /api/v1/auth/nonce
 * @desc Generate a nonce for wallet signing
 * @access Public
 */
router.post('/nonce', validationSchemas.createUserSchema, validate, generateNonce);

/**
 * @route POST /api/v1/auth/verify
 * @desc Verify wallet signature and authenticate user
 * @access Public
 */
router.post('/verify', verifySignature);

/**
 * @route GET /api/v1/auth/me
 * @desc Get current user profile
 * @access Private
 */
router.get('/me', authenticate, getCurrentUser);

/**
 * @route POST /api/v1/auth/logout
 * @desc Logout user
 * @access Private
 */
router.post('/logout', authenticate, logout);

/**
 * @route POST /api/v1/auth/session-key
 * @desc Generate a session key for DTK
 * @access Private
 */
router.post('/session-key', authenticate, generateSessionKey);

/**
 * @route DELETE /api/v1/auth/session-key/:sessionKey
 * @desc Revoke a session key
 * @access Private
 */
router.delete('/session-key/:sessionKey', authenticate, revokeSessionKey);

/**
 * @route GET /api/v1/auth/session-keys
 * @desc List all session keys for a wallet
 * @access Private
 */
router.get('/session-keys', authenticate, listSessionKeys);

export default router;