import { logger } from '../utils/logger';
import GaiaService from '../services/GaiaService';

/**
 * Process ETH transfer rule in natural language
 */
export async function processETHTransferRule(transferRule: string): Promise<any> {
  try {
    if (!transferRule) {
      throw new Error('No transfer rule defined');
    }
    
    // Process rule with Gaia AI
    const processedRule = await GaiaService.processNaturalLanguageRule(transferRule, 'eth-transfer');
    
    if (!processedRule) {
      throw new Error('Failed to process ETH transfer rule');
    }
    
    // Format for the database based on condition type
    const formattedCondition: any = {
      conditionType: processedRule.conditionType,
    };
    
    // Add specific fields based on condition type
    switch (processedRule.conditionType) {
      case 'price_threshold':
        // For ETH price conditions
        formattedCondition.priceCondition = {
          type: processedRule.thresholdType || 'above', // 'above' or 'below'
          priceThreshold: processedRule.priceThreshold?.toString(),
          referencePrice: processedRule.referencePrice?.toString()
        };
        break;
        
      case 'balance_threshold':
        // For wallet balance conditions
        formattedCondition.balanceCondition = {
          type: processedRule.thresholdType || 'above',
          balanceThreshold: processedRule.balanceThreshold?.toString()
        };
        break;
        
      case 'gas_price':
        // For gas price conditions
        formattedCondition.gasPriceCondition = {
          type: 'below', // Gas price conditions are always "below"
          gasPriceThreshold: processedRule.gasPriceThreshold?.toString()
        };
        break;
        
      case 'time_based':
        // For scheduled transfers
        formattedCondition.frequency = processedRule.frequency;
        break;
    }
    
    // Extract recipient and amount if provided in the rule
    if (processedRule.recipientAddress) {
      formattedCondition.recipientAddress = processedRule.recipientAddress;
    }
    
    if (processedRule.amount) {
      formattedCondition.amount = processedRule.amount.toString();
    }
    
    return formattedCondition;
  } catch (error: any) { // Added type annotation here
    logger.error(`Error processing ETH transfer rule:`, error);
    return null;
  }
}