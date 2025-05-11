import { Router } from 'express';
import {
    createDaoVoteTask,
    getDaoVoteTasks,
    getDaoDetails,
    getDaoProposalsList,
    updateDaoVoteTask,
    simulateDaoVoteRule
} from '../controllers/dao.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validationSchemas, validate } from '../middlewares/validation.middleware';

const router = Router();

/**
 * @route POST /api/v1/dao/vote-tasks
 * @desc Create a new DAO vote task
 * @access Private
 */
router.post(
    '/vote-tasks',
    authenticate,
    validationSchemas.createDaoVoteTaskSchema,
    validate,
    createDaoVoteTask
);

/**
 * @route GET /api/v1/dao/vote-tasks
 * @desc Get all DAO vote tasks for current user
 * @access Private
 */
router.get(
    '/vote-tasks',
    authenticate,
    validationSchemas.paginationQuerySchema,
    validate,
    getDaoVoteTasks
);

/**
 * @route PATCH /api/v1/dao/vote-tasks/:taskId
 * @desc Update a DAO vote task
 * @access Private
 */
router.patch(
    '/vote-tasks/:taskId',
    authenticate,
    updateDaoVoteTask
);

/**
 * @route GET /api/v1/dao/:daoAddress
 * @desc Get DAO details by address
 * @access Public
 */
router.get(
    '/:daoAddress',
    getDaoDetails
);

/**
 * @route GET /api/v1/dao/:daoAddress/proposals
 * @desc Get DAO proposals
 * @access Public
 */
router.get(
    '/:daoAddress/proposals',
    validationSchemas.paginationQuerySchema,
    validate,
    getDaoProposalsList
);

/**
 * @route POST /api/v1/dao/simulate-vote
 * @desc Simulate DAO vote rule
 * @access Public
 */
router.post(
    '/simulate-vote',
    simulateDaoVoteRule
);

export default router;