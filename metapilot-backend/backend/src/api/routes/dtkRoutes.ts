// backend/src/api/routes/dtkRoutes.ts
import express, { RequestHandler } from 'express';
import { logger } from '../../utils/logger';
import User from '../../models/User';
import SessionKeyService from '../../services/SessionKeyService';

const router = express.Router();

/**
 * Create a delegator account
 */
const createDelegatorAccountHandler: RequestHandler = async (req, res) => {
  try {
    const { userAddress } = req.body;
    
    if (!userAddress) {
      res.status(400).json({
        success: false,
        message: 'User address is required',
      });
      return;
    }
    
    // Find or create user
    let user = await User.findOne({ address: userAddress.toLowerCase() });
    if (!user) {
      user = await User.create({
        address: userAddress.toLowerCase(),
        preferences: {
          network: 'sepolia'
        }
      });
    }
    
    // Create delegator account
    const delegatorAddress = await SessionKeyService.createDelegatorAccount(userAddress);
    
    // Update user with delegator address
    user.delegatorAddress = delegatorAddress;
    await user.save();
    
    res.status(201).json({
      success: true,
      delegatorAddress,
    });
  } catch (error: any) {
    logger.error('Error creating delegator account:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating delegator account',
      error: error.message,
    });
  }
};

/**
 * Create a delegation for ETH transfers
 */
const createETHTransferDelegationHandler: RequestHandler = async (req, res) => {
  try {
    const { 
      userAddress, 
      sessionKeyAddress, 
      maxAmount, 
      recipientAddress, 
      expiryTimestamp 
    } = req.body;
    
    // Validate required parameters
    if (!userAddress || !sessionKeyAddress || !maxAmount || !recipientAddress || !expiryTimestamp) {
      res.status(400).json({
        success: false,
        message: 'Missing required parameters',
      });
      return;
    }
    
    // Find user
    const user = await User.findOne({ address: userAddress.toLowerCase() });
    if (!user || !user.delegatorAddress) {
      res.status(404).json({
        success: false,
        message: 'User not found or no delegator account associated',
      });
      return;
    }
    
    // Create delegation
    const delegation = await SessionKeyService.createETHTransferDelegation(
      user.delegatorAddress,
      sessionKeyAddress,
      maxAmount,
      recipientAddress,
      expiryTimestamp
    );
    
    res.status(201).json({
      success: true,
      delegation,
    });
  } catch (error: any) {
    logger.error('Error creating ETH transfer delegation:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating ETH transfer delegation',
      error: error.message,
    });
  }
};

router.post('/delegator-account', createDelegatorAccountHandler);
router.post('/eth-transfer-delegation', createETHTransferDelegationHandler);

export default router;