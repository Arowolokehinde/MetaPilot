// src/api/routes/dtkRoutes.ts
import express, { RequestHandler } from 'express';
import SessionKeyService from '../../services/SessionKeyService';
import User from '../../models/User';
import { logger } from '../../utils/logger';

const router = express.Router();

/**
 * Generate a session key for delegation
 */
const generateSessionKeyHandler: RequestHandler = async (req, res) => {
  try {
    const { userAddress } = req.body;
    
    if (!userAddress) {
      res.status(400).json({
        success: false,
        message: 'User address is required',
      });
      return;
    }
    
    // Create or find user
    let user = await User.findOne({ address: userAddress.toLowerCase() });
    
    if (!user) {
      // Handle user not found
      // You can either create a new user here or return an error
      // For this example, let's assume we want to create a new user
      user = await User.create({
        address: userAddress.toLowerCase(),
        // Add other required fields as needed
      });
      
      if (!user) {
        res.status(500).json({
          success: false,
          message: 'Failed to create user',
        });
        return;
      }
    }
    
    // Generate session key using SessionKeyService
    const sessionKey = await SessionKeyService.getSessionKey(user.id);
    
    if (!sessionKey) {
      res.status(500).json({
        success: false,
        message: 'Failed to generate session key',
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      sessionKey,
    });
  } catch (error: any) {
    logger.error('Error generating session key:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating session key',
      error: error.message,
    });
  }
};

router.post('/generate-session-key', generateSessionKeyHandler);

export default router;