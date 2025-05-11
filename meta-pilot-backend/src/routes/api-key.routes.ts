import { Router } from 'express';

import { authenticate, authenticateApiKey } from '../middlewares/auth.middleware';
import { createApiKeyHandler, getServiceApiKeysHandler, getUserApiKeysHandler, revokeApiKeyHandler, updateApiKeyHandler, verifyApiKeyHandler } from '../controllers/api-key.controller';

const router = Router();

/**
 * @route POST /api/v1/api-keys
 * @desc Create a new API key
 * @access Private
 */
router.post('/', authenticate, createApiKeyHandler);

/**
 * @route GET /api/v1/api-keys
 * @desc Get all API keys for current user
 * @access Private
 */
router.get('/', authenticate, getUserApiKeysHandler);

/**
 * @route GET /api/v1/api-keys/service/:serviceId
 * @desc Get API keys for a service
 * @access Private
 */
router.get('/service/:serviceId', authenticate, getServiceApiKeysHandler);

/**
 * @route DELETE /api/v1/api-keys/:keyId
 * @desc Revoke an API key
 * @access Private
 */
router.delete('/:keyId', authenticate, revokeApiKeyHandler);

/**
 * @route PATCH /api/v1/api-keys/:keyId
 * @desc Update API key
 * @access Private
 */
router.patch('/:keyId', authenticate, updateApiKeyHandler);

/**
 * @route GET /api/v1/api-keys/verify
 * @desc Verify current API key
 * @access API Key
 */
router.get('/verify', authenticateApiKey, verifyApiKeyHandler);

export default router;