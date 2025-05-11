import { Router } from 'express';
import {
    getUserActivitiesHandler,
    getWalletActivitiesHandler,
    getTaskActivitiesHandler,
    getActivityHandler,
    getActivityDashboard
} from '../controllers/activity.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validationSchemas, validate } from '../middlewares/validation.middleware';

const router = Router();

/**
 * @route GET /api/v1/activities
 * @desc Get user activities
 * @access Private
 */
router.get(
    '/',
    authenticate,
    validationSchemas.paginationQuerySchema,
    validate,
    getUserActivitiesHandler
);

/**
 * @route GET /api/v1/activities/dashboard
 * @desc Get activity dashboard summary
 * @access Private
 */
router.get(
    '/dashboard',
    authenticate,
    getActivityDashboard
);

/**
 * @route GET /api/v1/activities/wallet/:walletAddress
 * @desc Get wallet activities
 * @access Private
 */
router.get(
    '/wallet/:walletAddress',
    authenticate,
    validationSchemas.walletAddressParamSchema,
    validationSchemas.paginationQuerySchema,
    validate,
    getWalletActivitiesHandler
);

/**
 * @route GET /api/v1/activities/task/:taskId
 * @desc Get task activities
 * @access Private
 */
router.get(
    '/task/:taskId',
    authenticate,
    validationSchemas.idParamSchema,
    validationSchemas.paginationQuerySchema,
    validate,
    getTaskActivitiesHandler
);

/**
 * @route GET /api/v1/activities/:activityId
 * @desc Get activity by ID
 * @access Private
 */
router.get(
    '/:activityId',
    authenticate,
    validationSchemas.idParamSchema,
    validate,
    getActivityHandler
);

export default router;