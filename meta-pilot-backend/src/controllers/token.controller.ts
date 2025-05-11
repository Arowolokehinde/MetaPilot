import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { BadRequestError, NotFoundError, ForbiddenError } from '../utils/errors';
import { asyncHandler } from '../middlewares/error.middleware';
import Task, { TaskType, TaskStatus } from '../models/task.model';
import { ActivityType, ActivityStatus } from '../models/activity.model';
import { createActivity } from '../services/activity.service';
import { scheduleTask } from '../queues/scheduler';
import { getTokenPrice, getTokenInfo } from '../services/token.service';

/**
 * Create a token purchase task
 * @route POST /api/v1/tokens/purchase-tasks
 */
export const createTokenPurchaseTask = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new ForbiddenError('Authentication required');
    }

    const {
      name,
      walletAddress,
      tokenAddress,
      amount,
      priceCondition,
      maxPrice,
      chainId = 1
    } = req.body;

    // Validate wallet ownership
    if (walletAddress.toLowerCase() !== req.user.walletAddress.toLowerCase()) {
      throw new ForbiddenError('You do not have permission to create tasks for this wallet');
    }

    // Get token info for validation and task naming
    const tokenInfo = await getTokenInfo(tokenAddress, chainId);

    // Prepare rule parameters
    const ruleParams = {
      tokenAddress: tokenAddress.toLowerCase(),
      amount,
      priceCondition,
      maxPrice,
      chainId,
      tokenSymbol: tokenInfo?.symbol || 'Unknown',
      tokenDecimals: tokenInfo?.decimals || 18,
    };

    // Create task
    const task = await Task.create({
      taskId: uuidv4(),
      userId: req.user.userId,
      walletAddress: walletAddress.toLowerCase(),
      name: name || `Buy ${amount} ${tokenInfo?.symbol || tokenAddress}`,
      type: TaskType.BUY_TOKEN,
      rules: [
        {
          type: 'token_price_rule',
          condition: priceCondition,
          parameters: ruleParams,
        },
      ],
      metadata: {
        tokenAddress: tokenAddress.toLowerCase(),
        tokenSymbol: tokenInfo?.symbol,
        tokenName: tokenInfo?.name,
        amount,
        maxPrice,
        chainId,
      },
      status: TaskStatus.ACTIVE,
    });

    // Schedule task
    await scheduleTask(task);

    // Log activity
    await createActivity({
      userId: req.user.userId,
      walletAddress: walletAddress.toLowerCase(),
      type: ActivityType.TASK_CREATED,
      taskType: TaskType.BUY_TOKEN,
      taskId: task.taskId,
      status: ActivityStatus.SUCCESS,
      details: `Token purchase task "${task.name}" created`,
      metadata: {
        tokenAddress,
        amount,
        priceCondition,
        chainId,
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
 * Create a token swap task
 * @route POST /api/v1/tokens/swap-tasks
 */
export const createTokenSwapTask = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new ForbiddenError('Authentication required');
    }

    const {
      name,
      walletAddress,
      fromTokenAddress,
      toTokenAddress,
      amount,
      priceCondition,
      slippage = 0.5,
      chainId = 1
    } = req.body;

    // Validate wallet ownership
    if (walletAddress.toLowerCase() !== req.user.walletAddress.toLowerCase()) {
      throw new ForbiddenError('You do not have permission to create tasks for this wallet');
    }

    // Get token info for validation and task naming
    const fromTokenInfo = await getTokenInfo(fromTokenAddress, chainId);
    const toTokenInfo = await getTokenInfo(toTokenAddress, chainId);

    // Prepare rule parameters
    const ruleParams = {
      fromTokenAddress: fromTokenAddress.toLowerCase(),
      toTokenAddress: toTokenAddress.toLowerCase(),
      amount,
      priceCondition,
      slippage,
      chainId,
      fromTokenSymbol: fromTokenInfo?.symbol || 'Unknown',
      toTokenSymbol: toTokenInfo?.symbol || 'Unknown',
      fromTokenDecimals: fromTokenInfo?.decimals || 18,
      toTokenDecimals: toTokenInfo?.decimals || 18,
    };

    // Create task
    const task = await Task.create({
      taskId: uuidv4(),
      userId: req.user.userId,
      walletAddress: walletAddress.toLowerCase(),
      name: name || `Swap ${amount} ${fromTokenInfo?.symbol || fromTokenAddress} to ${toTokenInfo?.symbol || toTokenAddress}`,
      type: TaskType.TOKEN_SWAP,
      rules: [
        {
          type: 'token_swap_rule',
          condition: priceCondition,
          parameters: ruleParams,
        },
      ],
      metadata: {
        fromTokenAddress: fromTokenAddress.toLowerCase(),
        fromTokenSymbol: fromTokenInfo?.symbol,
        fromTokenName: fromTokenInfo?.name,
        toTokenAddress: toTokenAddress.toLowerCase(),
        toTokenSymbol: toTokenInfo?.symbol,
        toTokenName: toTokenInfo?.name,
        amount,
        slippage,
        chainId,
      },
      status: TaskStatus.ACTIVE,
    });

    // Schedule task
    await scheduleTask(task);

    // Log activity
    await createActivity({
      userId: req.user.userId,
      walletAddress: walletAddress.toLowerCase(),
      type: ActivityType.TASK_CREATED,
      taskType: TaskType.TOKEN_SWAP,
      taskId: task.taskId,
      status: ActivityStatus.SUCCESS,
      details: `Token swap task "${task.name}" created`,
      metadata: {
        fromTokenAddress,
        toTokenAddress,
        amount,
        priceCondition,
        chainId,
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
 * Get all token purchase tasks
 * @route GET /api/v1/tokens/purchase-tasks
 */
export const getTokenPurchaseTasks = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new ForbiddenError('Authentication required');
    }

    // Parse pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Filter by token purchase tasks
    const filters: any = {
      userId: req.user.userId,
      type: TaskType.BUY_TOKEN,
    };

    if (req.query.status) {
      filters.status = req.query.status;
    }

    if (req.query.walletAddress) {
      filters.walletAddress = (req.query.walletAddress as string).toLowerCase();
    }

    if (req.query.tokenAddress) {
      filters['metadata.tokenAddress'] = (req.query.tokenAddress as string).toLowerCase();
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
 * Get token price
 * @route GET /api/v1/tokens/:tokenAddress/price
 */
export const getTokenPriceEndpoint = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { tokenAddress } = req.params;
    const chainId = parseInt(req.query.chainId as string) || 1;

    // Get token price
    const priceData = await getTokenPrice(tokenAddress, chainId);

    res.status(200).json({
      status: 'success',
      data: priceData,
    });
  }
);

/**
 * Get token info
 * @route GET /api/v1/tokens/:tokenAddress
 */
export const getTokenInfoEndpoint = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { tokenAddress } = req.params;
    const chainId = parseInt(req.query.chainId as string) || 1;

    // Get token info
    const tokenData = await getTokenInfo(tokenAddress, chainId);

    if (!tokenData) {
      throw new NotFoundError('Token not found');
    }

    res.status(200).json({
      status: 'success',
      data: tokenData,
    });
  }
);

/**
 * Update a token purchase task
 * @route PATCH /api/v1/tokens/purchase-tasks/:taskId
 */
export const updateTokenPurchaseTask = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new ForbiddenError('Authentication required');
    }

    const { taskId } = req.params;
    const { name, amount, priceCondition, maxPrice, status } = req.body;

    // Find task
    const task = await Task.findOne({ taskId, type: TaskType.BUY_TOKEN });

    if (!task) {
      throw new NotFoundError('Token purchase task not found');
    }

    // Check ownership
    if (task.userId !== req.user.userId) {
      throw new ForbiddenError('You do not have permission to update this task');
    }

    // Update allowed fields
    if (name) task.name = name;
    if (status) task.status = status;

    // Update metadata
    if (amount) task.metadata.amount = amount;
    if (maxPrice) task.metadata.maxPrice = maxPrice;

    // Update rule if necessary
    if (priceCondition || amount || maxPrice) {
      const ruleIndex = task.rules.findIndex(rule => rule.type === 'token_price_rule');

      if (ruleIndex !== -1) {
        if (priceCondition) task.rules[ruleIndex].condition = priceCondition;
        if (amount) task.rules[ruleIndex].parameters.amount = amount;
        if (maxPrice) task.rules[ruleIndex].parameters.maxPrice = maxPrice;
      }
    }

    // Save changes
    await task.save();

    // Reschedule task
    await scheduleTask(task);

    // Log activity
    await createActivity({
      userId: req.user.userId,
      walletAddress: task.walletAddress,
      type: ActivityType.TASK_UPDATED,
      taskType: TaskType.BUY_TOKEN,
      taskId: task.taskId,
      status: ActivityStatus.SUCCESS,
      details: `Token purchase task "${task.name}" updated`,
      metadata: {
        updates: {
          name: name || undefined,
          status: status || undefined,
          amount: amount || undefined,
          priceCondition: priceCondition || undefined,
          maxPrice: maxPrice || undefined,
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