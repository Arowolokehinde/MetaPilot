// src/middleware/dtkAuth.ts
import { Request, Response, NextFunction } from 'express';
import SessionKeyService from '../services/SessionKeyService';
import { logger } from '../utils/logger';

/**
 * Middleware to verify if a request is authenticated with a valid session key
 */
export const dtkAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionKeyAddress = req.headers['x-session-key'] as string;
    const contractAddress = req.headers['x-contract-address'] as string;
    const functionSelector = req.headers['x-function-selector'] as string;
    
    if (!sessionKeyAddress) {
      return res.status(401).json({
        success: false,
        message: 'No session key provided',
      });
    }
    
    // If contract access is being requested, verify permissions
    if (contractAddress && functionSelector) {
      const hasPermission = await SessionKeyService.hasPermission(
        sessionKeyAddress,
        contractAddress,
        functionSelector
      );
      
      if (!hasPermission) {
        logger.warn(`Session key ${sessionKeyAddress} attempted to access unauthorized function ${functionSelector} on contract ${contractAddress}`);
        return res.status(403).json({
          success: false,
          message: 'Session key does not have required permissions',
        });
      }
    }
    
    // Session key is valid - attach to request for later use
    req.sessionKey = sessionKeyAddress;
    next();
  } catch (error) {
    logger.error('Error in DTK auth middleware:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication',
    });
  }
};

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      sessionKey?: string;
    }
  }
}