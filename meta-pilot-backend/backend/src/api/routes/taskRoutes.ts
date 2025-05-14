// src/api/routes/taskRoutes.ts
import express, { RequestHandler } from 'express';
import mongoose from 'mongoose';
import Task from '../../models/Task';
import User from '../../models/User';
import { createETHTransferTask } from '../../models/taskTypes/ETHTransferTask';
import { logger } from '../../utils/logger';
import { queueRuleProcessing } from '../../processors/RuleProcessingProcessor';
import AIBridgeService from '../../services/AIBridgeService';

const router = express.Router();



/**
 * Get all tasks for a user
 */
const getUserTasksHandler: RequestHandler = async (req, res) => {
  try {
    const { userAddress } = req.params;
    
    // Find user
    const user = await User.findOne({ address: userAddress.toLowerCase() });
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }
    
    // Get tasks
    const tasks = await Task.find({ userId: user._id })
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      tasks,
    });
  } catch (error: any) {
    logger.error('Error fetching tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tasks',
    });
  }
};

/**
 * Get single task by ID
 */
const getTaskByIdHandler: RequestHandler = async (req, res) => {
  try {
    const { taskId } = req.params;
    
    // Validate ObjectID
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid task ID',
      });
      return;
    }
    
    // Find task
    const task = await Task.findById(taskId);
    if (!task) {
      res.status(404).json({
        success: false,
        message: 'Task not found',
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      task,
    });
  } catch (error: any) {
    logger.error('Error fetching task:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching task',
    });
  }
};
/**
 * Create a new ETH transfer task
 */
const createETHTransferTaskHandler: RequestHandler = async (req, res) => {
  try {
    const { userAddress, name, description, configuration, conditions, sessionKeyAddress } = req.body;
    
    // Find user
    const user = await User.findOne({ address: userAddress.toLowerCase() });
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }
    
    // Validate session key if provided
    if (sessionKeyAddress) {
      const delegations = await User.findOne({
        address: userAddress.toLowerCase(),
        'delegations.sessionKeyAddress': sessionKeyAddress,
        'delegations.status': 'active',
        'delegations.expiresAt': { $gt: new Date() },
      });
      
      if (!delegations) {
        res.status(400).json({
          success: false,
          message: 'Invalid or expired session key',
        });
        return;
      }
    }
    
    // Check if we need to process a natural language rule
    const hasNaturalLanguageRule = !!configuration.transferRule;
    
    // Create or get AI agent for the user
    if (!user.agentId) {
      try {
        // Type assertion for user._id
        const agentId = await AIBridgeService.createAgentForUser(
          user._id.toString(), 
          user.address
        );
        
        // Use type assertion or property assignment here
        (user as any).agentId = agentId;
        await user.save();
      } catch (error: any) {
        logger.error(`Error creating agent for user ${user._id}:`, error);
        // Continue without agent - we'll use direct execution
      }
    }
    
    // Set network to Sepolia for ETH transfers
    const network = 'sepolia';
    
    // Create task using helper with type assertion for user._id
    const taskData = createETHTransferTask({
      userId: user._id as any,
      name,
      description,
      sessionKeyId: sessionKeyAddress,
      configuration,
      conditions: conditions || {}, // Use empty object if not provided
      network: network,
      status: sessionKeyAddress ? 'active' : 'pending',
    });
    
    // Save task
    const task = await Task.create(taskData);
    
    // If we have a natural language rule, queue it for processing
    if (hasNaturalLanguageRule) {
      // Type assertion for task._id
      await queueRuleProcessing((task._id as any).toString());
    }
    
    res.status(201).json({
      success: true,
      task,
    });
  } catch (error: any) {
    logger.error('Error creating ETH transfer task:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating ETH transfer task',
      error: error.message,
    });
  }
};

/**
 * Update task status (pause/activate)
 */
const updateTaskStatusHandler: RequestHandler = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status, userAddress } = req.body;
    
    // Validate status
    if (!['active', 'paused'].includes(status)) {
      res.status(400).json({
        success: false,
        message: 'Invalid status. Must be "active" or "paused"',
      });
      return;
    }
    
    // Find user
    const user = await User.findOne({ address: userAddress.toLowerCase() });
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }
    
    // Find and update task
    const task = await Task.findOneAndUpdate(
      { _id: taskId, userId: user._id },
      { status },
      { new: true }
    );
    
    if (!task) {
      res.status(404).json({
        success: false,
        message: 'Task not found or not owned by user',
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      task,
    });
  } catch (error: any) {
    logger.error('Error updating task status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating task status',
    });
  }
};

/**
 * Delete a task
 */
const deleteTaskHandler: RequestHandler = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { userAddress } = req.body;
    
    // Find user
    const user = await User.findOne({ address: userAddress.toLowerCase() });
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }
    
    // Find and delete task
    const task = await Task.findOneAndDelete({
      _id: taskId,
      userId: user._id,
    });
    
    if (!task) {
      res.status(404).json({
        success: false,
        message: 'Task not found or not owned by user',
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error: any) {
    logger.error('Error deleting task:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting task',
    });
  }
};

/**
 * Get task execution history
 */
const getTaskHistoryHandler: RequestHandler = async (req, res) => {
  try {
    const { taskId } = req.params;
    
    // Find task
    const task = await Task.findById(taskId);
    if (!task) {
      res.status(404).json({
        success: false,
        message: 'Task not found',
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      history: task.executionHistory,
    });
  } catch (error: any) {
    logger.error('Error fetching task history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching task history',
    });
  }
};

// Register route handlers
router.get('/user/:userAddress', getUserTasksHandler);
router.get('/:taskId', getTaskByIdHandler);
router.post('/eth-transfer', createETHTransferTaskHandler);
router.patch('/:taskId/status', updateTaskStatusHandler);
router.delete('/:taskId', deleteTaskHandler);
router.get('/:taskId/history', getTaskHistoryHandler);

export default router;