import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { BadRequestError, NotFoundError, ForbiddenError } from '../utils/errors';
import { asyncHandler } from '../middlewares/error.middleware';
import Task, { TaskType, TaskStatus } from '../models/task.model';
import { ActivityType, ActivityStatus } from '../models/activity.model';
import { createActivity } from '../services/activity.service';
import { scheduleTask } from '../queues/scheduler';
import { getDAODetails, getDAOProposals } from '../services/dao.service';

/**
 * Create a new DAO vote task
 * @route POST /api/v1/dao/vote-tasks
 */
export const createDaoVoteTask = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new ForbiddenError('Authentication required');
    }

    const { name, walletAddress, daoAddress, votingRule, chainId = 1 } = req.body;

    // Validate wallet ownership
    if (walletAddress.toLowerCase() !== req.user.walletAddress.toLowerCase()) {
      throw new ForbiddenError('You do not have permission to create tasks for this wallet');
    }

    // Prepare rule parameters
    const ruleParams = {
      daoAddress: daoAddress.toLowerCase(),
      votingRule,
      chainId,
    };

    // Create task
    const task = await Task.create({
      taskId: uuidv4(),
      userId: req.user.userId,
      walletAddress: walletAddress.toLowerCase(),
      name: name || `Vote on ${daoAddress} proposals`,
      type: TaskType.DAO_VOTE,
      rules: [
        {
          type: 'dao_vote_rule',
          condition: votingRule,
          parameters: ruleParams,
        },
      ],
      metadata: {
        daoAddress: daoAddress.toLowerCase(),
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
      taskType: TaskType.DAO_VOTE,
      taskId: task.taskId,
      status: ActivityStatus.SUCCESS,
      details: `DAO vote task "${task.name}" created`,
      metadata: {
        daoAddress,
        votingRule,
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
 * Get all DAO vote tasks for current user
 * @route GET /api/v1/dao/vote-tasks
 */
export const getDaoVoteTasks = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new ForbiddenError('Authentication required');
    }

    // Parse pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Filter by DAO vote tasks
    const filters: any = {
      userId: req.user.userId,
      type: TaskType.DAO_VOTE,
    };

    if (req.query.status) {
      filters.status = req.query.status;
    }

    if (req.query.walletAddress) {
      filters.walletAddress = (req.query.walletAddress as string).toLowerCase();
    }

    if (req.query.daoAddress) {
      filters['metadata.daoAddress'] = (req.query.daoAddress as string).toLowerCase();
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
 * Get DAO details by address
 * @route GET /api/v1/dao/:daoAddress
 */
export const getDaoDetails = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { daoAddress } = req.params;
    const chainId = parseInt(req.query.chainId as string) || 1;

    // Get DAO details
    const details = await getDAODetails(daoAddress, chainId);

    res.status(200).json({
      status: 'success',
      data: {
        dao: details,
      },
    });
  }
);

/**
 * Get DAO proposals
 * @route GET /api/v1/dao/:daoAddress/proposals
 */
export const getDaoProposalsList = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { daoAddress } = req.params;
    const chainId = parseInt(req.query.chainId as string) || 1;

    // Parse pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    // Get DAO proposals
    const proposals = await getDAOProposals(daoAddress, chainId, page, limit);

    res.status(200).json({
      status: 'success',
      data: {
        proposals: proposals.proposals,
        pagination: proposals.pagination,
      },
    });
  }
);

/**
 * Update a DAO vote task
 * @route PATCH /api/v1/dao/vote-tasks/:taskId
 */
export const updateDaoVoteTask = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new ForbiddenError('Authentication required');
    }

    const { taskId } = req.params;
    const { name, votingRule, status } = req.body;

    // Find task
    const task = await Task.findOne({ taskId, type: TaskType.DAO_VOTE });

    if (!task) {
      throw new NotFoundError('DAO vote task not found');
    }

    // Check ownership
    if (task.userId !== req.user.userId) {
      throw new ForbiddenError('You do not have permission to update this task');
    }

    // Update allowed fields
    if (name) task.name = name;
    if (status) task.status = status;

    // Update voting rule if provided
    if (votingRule) {
      // Find the rule
      const ruleIndex = task.rules.findIndex(rule => rule.type === 'dao_vote_rule');

      if (ruleIndex !== -1) {
        task.rules[ruleIndex].condition = votingRule;
      } else {
        // If no rule exists, create one
        task.rules.push({
          type: 'dao_vote_rule',
          condition: votingRule,
          parameters: task.metadata || {},
        });
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
      taskType: TaskType.DAO_VOTE,
      taskId: task.taskId,
      status: ActivityStatus.SUCCESS,
      details: `DAO vote task "${task.name}" updated`,
      metadata: {
        updates: {
          name: name || undefined,
          status: status || undefined,
          votingRule: votingRule || undefined,
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
 * Simulate DAO vote rule
 * @route POST /api/v1/dao/simulate-vote
 */
export const simulateDaoVoteRule = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { votingRule, proposalTitle, proposalDescription } = req.body;

    if (!votingRule || !proposalTitle) {
      throw new BadRequestError('Voting rule and proposal title are required');
    }

    // Simulate vote based on the rule and proposal content
    const voteDecision = simulateVoteDecision(votingRule, proposalTitle, proposalDescription);

    res.status(200).json({
      status: 'success',
      data: {
        voteDecision,
        reasoning: voteDecision.reasoning,
      },
    });
  }
);

/**
 * Helper function to simulate vote decision based on a rule
 */
function simulateVoteDecision(
  rule: string,
  proposalTitle: string,
  proposalDescription?: string
) {
  // Simple keyword matching for simulation purposes
  // In production, this would use NLP for better analysis
  const fullText = `${proposalTitle} ${proposalDescription || ''}`.toLowerCase();

  // Parse the rule
  const voteYesMatch = rule.match(/vote yes if (.*)/i);
  const voteNoMatch = rule.match(/vote no if (.*)/i);

  if (voteYesMatch) {
    const condition = voteYesMatch[1].toLowerCase();
    const keywords = condition.split(' ').filter(keyword => keyword.length > 2);

    const matchedKeywords = keywords.filter(keyword => fullText.includes(keyword));

    if (matchedKeywords.length > 0) {
      return {
        vote: 'YES',
        reasoning: `Matched keywords: ${matchedKeywords.join(', ')}`,
      };
    } else {
      return {
        vote: 'NO',
        reasoning: `Did not match any keywords for YES condition: ${keywords.join(', ')}`,
      };
    }
  } else if (voteNoMatch) {
    const condition = voteNoMatch[1].toLowerCase();
    const keywords = condition.split(' ').filter(keyword => keyword.length > 2);

    const matchedKeywords = keywords.filter(keyword => fullText.includes(keyword));

    if (matchedKeywords.length > 0) {
      return {
        vote: 'NO',
        reasoning: `Matched keywords: ${matchedKeywords.join(', ')}`,
      };
    } else {
      return {
        vote: 'YES',
        reasoning: `Did not match any keywords for NO condition: ${keywords.join(', ')}`,
      };
    }
  } else {
    // Default
    return {
      vote: 'ABSTAIN',
      reasoning: 'No matching rule pattern found',
    };
  }
}