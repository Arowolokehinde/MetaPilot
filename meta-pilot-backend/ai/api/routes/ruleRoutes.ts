import express from 'express';
import { processETHTransferRule } from '../../src/processors/RuleProcessor';
import { logger } from '../../src/utils/logger';
import { RequestHandler } from 'express';

const router = express.Router();

/**
 * Process ETH transfer rule
 */
const processETHTransferRuleHandler: RequestHandler = async (req, res) => {
  try {
    const { transferRule } = req.body;
    
    if (!transferRule) {
      res.status(400).json({
        success: false,
        message: 'Transfer rule is required',
      });
      return;
    }
    
    const conditions = await processETHTransferRule(transferRule);
    
    if (!conditions) {
      res.status(500).json({
        success: false,
        message: 'Failed to process transfer rule',
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      conditions,
    });
  } catch (error: any) {
    logger.error('Error processing ETH transfer rule:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing ETH transfer rule',
      error: error.message,
    });
  }
};

router.post('/eth-transfer', processETHTransferRuleHandler);

export default router;