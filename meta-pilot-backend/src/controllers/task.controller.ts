import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { asyncHandler } from '../middlewares/error.middleware';
import Task, { TaskType, TaskStatus } from '../models/task.model';
import { ActivityType, ActivityStatus } from '../models/activity.model';
import { createActivity } from '../services/activity.service';
import { scheduleTask } from '../queues/scheduler';

/**
 * Create a new task
 * @route POST /api/v1/tasks
 */
export const createTask = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new ForbiddenError('Authentication required');
    }

    const { name, type, walletAddress, rules, metadata } = req.body;

    // Validate wallet ownership
    if (walletAddress.toLowerCase() !== req.user.walletAddress.toLowerCase()) {
      throw new ForbiddenError('You do not have permission to create tasks for this wallet');
    }

    // Create task
    const task = await Task.create({
      taskId: uuidv4(),
      userId: req.user.userId,
      walletAddress: walletAddress.toLowerCase(),
      name,
      type,
      rules,
      metadata: metadata || {},
      status: TaskStatus.ACTIVE,
    });

    // Schedule task based on type
    await scheduleTask(task);

    // Log activity
    await createActivity({
      userId: req.user.userId,
      walletAddress: walletAddress.toLowerCase(),
      type: ActivityType.TASK_CREATED,
      taskType: type as TaskType,
      taskId: task.taskId,
      status: ActivityStatus.SUCCESS,
      details: `Task "${name}" created`,
      metadata: {
        taskType: type,
        rules,
      },
    });

    res.status(201).json({
      status: 'success',
      data: {
        task,
      },
    });
  }
);

/**
 * Get all tasks for current user
 * @route GET /api/v1/tasks
 */
export const getTasks = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new ForbiddenError('Authentication required');
    }

    // Parse pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Parse filters
    const filters: any = { userId: req.user.userId };

    if (req.query.type) {
      filters.type = req.query.type;
    }

    if (req.query.status) {
      filters.status = req.query.status;
    }

    if (req.query.walletAddress) {
      filters.walletAddress = (req.query.walletAddress as string).toLowerCase();
    }

    // Count total documents
    const total = await Task.countDocuments(filters);

    // Get tasks
    const tasks = await Task.find(filters)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      status: 'success',
      data: {
        tasks,
        pagination: {
          total,
          page,
          limit,
          totalPages,
        },
      },
    });
  }
);

/**
 * Get a single task by ID
 * @route GET /api/v1/tasks/:taskId
 */
export const getTask = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new ForbiddenError('Authentication required');
    }

    const { taskId } = req.params;

    // Find task
    const task = await Task.findOne({ taskId });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Check ownership
    if (task.userId !== req.user.userId) {
      throw new ForbiddenError('You do not have permission to access this task');
    }

    res.status(200).json({
      status: 'success',
      data: {
        task,
      },
    });
  }
);

/**
 * Update a task
 * @route PATCH /api/v1/tasks/:taskId
 */
export const updateTask = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new ForbiddenError('Authentication required');
    }

    const { taskId } = req.params;
    const { name, status, rules, metadata } = req.body;

    // Find task
    const task = await Task.findOne({ taskId });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Check ownership
    if (task.userId !== req.user.userId) {
      throw new ForbiddenError('You do not have permission to update this task');
    }

    // Update allowed fields
    if (name) task.name = name;
    if (status) task.status = status;
    if (rules) task.rules = rules;
    if (metadata) task.metadata = { ...task.metadata, ...metadata };

    // Save changes
    await task.save();

    // Reschedule task if needed
    if (status || rules) {
      await scheduleTask(task);
    }

    // Log activity
    await createActivity({
      userId: req.user.userId,
      walletAddress: task.walletAddress,
      type: ActivityType.TASK_UPDATED,
      taskType: task.type,
      taskId: task.taskId,
      status: ActivityStatus.SUCCESS,
      details: `Task "${task.name}" updated`,
      metadata: {
        updates: {
          name: name || undefined,
          status: status || undefined,
          rules: rules ? true : undefined,
          metadata: metadata ? true : undefined,
        },
      },
    });

    res.status(200).json({
      status: 'success',
      data: {
        task,
      },
    });
  }
);

/**
 * Delete a task
 * @route DELETE /api/v1/tasks/:taskId
 */
/**
 * Delete a task
 * @route DELETE /api/v1/tasks/:taskId
 */
export const deleteTask = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new ForbiddenError('Authentication required');
    }

    const { taskId } = req.params;

    // Find task
    const task = await Task.findOne({ taskId });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Check ownership
    if (task.userId !== req.user.userId) {
      throw new ForbiddenError('You do not have permission to delete this task');
    }

    // Store task details before deletion for activity logging
    const { name, walletAddress, type } = task;

    // Delete task - use deleteOne() instead of remove()
    await Task.deleteOne({ _id: task._id });

    // Log activity
    await createActivity({
      userId: req.user.userId,
      walletAddress: walletAddress,
      type: ActivityType.TASK_DELETED,
      taskType: type,
      taskId: taskId,
      status: ActivityStatus.SUCCESS,
      details: `Task "${name}" deleted`,
    });

    res.status(200).json({
      status: 'success',
      message: 'Task deleted successfully',
    });
  }
);

/**
 * Pause a task
 * @route PATCH /api/v1/tasks/:taskId/pause
 */
export const pauseTask = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new ForbiddenError('Authentication required');
    }

    const { taskId } = req.params;

    // Find task
    const task = await Task.findOne({ taskId });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Check ownership
    if (task.userId !== req.user.userId) {
      throw new ForbiddenError('You do not have permission to pause this task');
    }

    // Update status
    task.status = TaskStatus.PAUSED;
    await task.save();

    // Log activity
    await createActivity({
      userId: req.user.userId,
      walletAddress: task.walletAddress,
      type: ActivityType.TASK_UPDATED,
      taskType: task.type,
      taskId: task.taskId,
      status: ActivityStatus.SUCCESS,
      details: `Task "${task.name}" paused`,
    });

    res.status(200).json({
      status: 'success',
      data: {
        task,
      },
    });
  }
);

/**
 * Resume a task
 * @route PATCH /api/v1/tasks/:taskId/resume
 */
export const resumeTask = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new ForbiddenError('Authentication required');
    }

    const { taskId } = req.params;

    // Find task
    const task = await Task.findOne({ taskId });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Check ownership
    if (task.userId !== req.user.userId) {
      throw new ForbiddenError('You do not have permission to resume this task');
    }

    // Update status
    task.status = TaskStatus.ACTIVE;
    await task.save();

    // Reschedule task
    await scheduleTask(task);

    // Log activity
    await createActivity({
      userId: req.user.userId,
      walletAddress: task.walletAddress,
      type: ActivityType.TASK_UPDATED,
      taskType: task.type,
      taskId: task.taskId,
      status: ActivityStatus.SUCCESS,
      details: `Task "${task.name}" resumed`,
    });

    res.status(200).json({
      status: 'success',
      data: {
        task,
      },
    });
  }
);

/**
 * Get task execution history
 * @route GET /api/v1/tasks/:taskId/history
 */
export const getTaskHistory = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new ForbiddenError('Authentication required');
    }

    const { taskId } = req.params;

    // Find task
    const task = await Task.findOne({ taskId });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Check ownership
    if (task.userId !== req.user.userId) {
      throw new ForbiddenError('You do not have permission to access this task');
    }

    // Get execution history
    const history = task.executionHistory.sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    res.status(200).json({
      status: 'success',
      data: {
        history,
      },
    });
  }
);