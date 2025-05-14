import express from 'express';
import AgentManager from '../../src/agents/AgentManager';
import { logger } from '../../src/utils/logger';
import { RequestHandler } from 'express';

const router = express.Router();

// Define a type-safe handler - remove return statements on res calls
const createAgentHandler: RequestHandler = async (req, res, next) => {
  try {
    const { userId, walletAddress } = req.body;
    
    if (!userId || !walletAddress) {
      res.status(400).json({
        success: false,
        message: 'User ID and wallet address are required',
      });
      return; // Return void, not the response object
    }
    
    const agentId = await AgentManager.createAgentForUser(userId, walletAddress);
    
    res.status(201).json({
      success: true,
      agentId,
    });
  } catch (error: any) {
    logger.error('Error creating agent:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating agent',
      error: error.message,
    });
  }
};

// Apply the handler to the route
router.post('/', createAgentHandler);

// Define the ETH transfer handler - same change here
const executeETHTransferHandler: RequestHandler = async (req, res, next) => {
  try {
    const { agentId } = req.params;
    const {
      sessionKeyAddress,
      privateKey,
      recipientAddress,
      amount
    } = req.body;
    
    // Validate required parameters
    if (!sessionKeyAddress || !privateKey || !recipientAddress || !amount) {
      res.status(400).json({
        success: false,
        message: 'Missing required parameters',
      });
      return; // Return void, not the response object
    }
    
    const result = await AgentManager.executeETHTransfer(agentId, {
      sessionKeyAddress,
      privateKey,
      recipientAddress,
      amount
    });
    
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error: any) {
    logger.error('Error executing ETH transfer:', error);
    res.status(500).json({
      success: false,
      message: 'Error executing ETH transfer',
      error: error.message,
    });
  }
};

router.post('/:agentId/execute/eth-transfer', executeETHTransferHandler);

export default router;