import { Router } from 'express';
import {
    createTask,
    getTasks,
    getTask,
    updateTask,
    deleteTask,
    pauseTask,
    resumeTask,
    getTaskHistory
} from '../controllers/task.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validationSchemas, validate } from '../middlewares/validation.middleware';

const router = Router();

/**
 * @route POST /api/v1/tasks
 * @desc Create a new task
 * @access Private
 */
router.post(
    '/',
    authenticate,
    validationSchemas.createTaskSchema,
    validate,
    createTask
);

/**
 * @route GET /api/v1/tasks
 * @desc Get all tasks for current user
 * @access Private
 */
router.get(
    '/',
    authenticate,
    validationSchemas.paginationQuerySchema,
    validate,
    getTasks
);

/**
 * @route GET /api/v1/tasks/:taskId
 * @desc Get a single task by ID
 * @access Private
 */
router.get(
    '/:taskId',
    authenticate,
    getTask
);

/**
 * @route PATCH /api/v1/tasks/:taskId
 * @desc Update a task
 * @access Private
 */
router.patch(
    '/:taskId',
    authenticate,
    validationSchemas.updateTaskSchema,
    validate,
    updateTask
);

/**
 * @route DELETE /api/v1/tasks/:taskId
 * @desc Delete a task
 * @access Private
 */
router.delete(
    '/:taskId',
    authenticate,
    deleteTask
);

/**
 * @route PATCH /api/v1/tasks/:taskId/pause
 * @desc Pause a task
 * @access Private
 */
router.patch(
    '/:taskId/pause',
    authenticate,
    pauseTask
);

/**
 * @route PATCH /api/v1/tasks/:taskId/resume
 * @desc Resume a task
 * @access Private
 */
router.patch(
    '/:taskId/resume',
    authenticate,
    resumeTask
);

/**
 * @route GET /api/v1/tasks/:taskId/history
 * @desc Get task execution history
 * @access Private
 */
router.get(
    '/:taskId/history',
    authenticate,
    getTaskHistory
);

export default router;