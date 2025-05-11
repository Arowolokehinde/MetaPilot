import { Router } from 'express';
import {
    createTokenPurchaseTask,
    createTokenSwapTask,
    getTokenPurchaseTasks,
    getTokenPriceEndpoint,
    getTokenInfoEndpoint,
    updateTokenPurchaseTask
} from '../controllers/token.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validationSchemas, validate } from '../middlewares/validation.middleware';

const router = Router();

/**
 * @route POST /api/v1/tokens/purchase-tasks
 * @desc Create a token purchase task
 * @access Private
 */
router.post(
    '/purchase-tasks',
    authenticate,
    validationSchemas.createTokenPurchaseTaskSchema,
    validate,
    createTokenPurchaseTask
);

/**
 * @route POST /api/v1/tokens/swap-tasks
 * @desc Create a token swap task
 * @access Private
 */
router.post(
    '/swap-tasks',
    authenticate,
    // validationSchemas.createTokenSwapTaskSchema, 
    // validate, 
    createTokenSwapTask
);

/**
 * @route GET /api/v1/tokens/purchase-tasks
 * @desc Get all token purchase tasks
 * @access Private
 */
router.get(
    '/purchase-tasks',
    authenticate,
    validationSchemas.paginationQuerySchema,
    validate,
    getTokenPurchaseTasks
);

/**
 * @route PATCH /api/v1/tokens/purchase-tasks/:taskId
 * @desc Update a token purchase task
 * @access Private
 */
router.patch(
    '/purchase-tasks/:taskId',
    authenticate,
    updateTokenPurchaseTask
);

/**
 * @route GET /api/v1/tokens/:tokenAddress/price
 * @desc Get token price
 * @access Public
 */
router.get(
    '/:tokenAddress/price',
    getTokenPriceEndpoint
);

/**
 * @route GET /api/v1/tokens/:tokenAddress
 * @desc Get token info
 * @access Public
 */
router.get(
    '/:tokenAddress',
    getTokenInfoEndpoint
);

export default router;