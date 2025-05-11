import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { ValidationError } from '../utils/errors';

/**
 * Middleware to validate request against validation chain
 */
export const validate = (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // Convert errors to more readable format
        const validationErrors = errors.array().reduce((acc: Record<string, string>, error: any) => {
            const path = error.path || error.param;
            const msg = error.msg;

            acc[path] = msg;
            return acc;
        }, {});

        throw new ValidationError('Validation failed', validationErrors);
    }

    next();
};

/**
 * Validation schemas for various endpoints
 */
export const validationSchemas = {
    // User validation
    createUserSchema: [
        body('walletAddress')
            .notEmpty()
            .withMessage('Wallet address is required')
            .matches(/^0x[a-fA-F0-9]{40}$/)
            .withMessage('Invalid Ethereum address format'),
        body('email')
            .optional()
            .isEmail()
            .withMessage('Invalid email format'),
    ],

    // Task validation
    createTaskSchema: [
        body('name')
            .notEmpty()
            .withMessage('Task name is required')
            .isString()
            .withMessage('Task name must be a string'),
        body('type')
            .notEmpty()
            .withMessage('Task type is required')
            .isString()
            .withMessage('Task type must be a string'),
        body('walletAddress')
            .notEmpty()
            .withMessage('Wallet address is required')
            .matches(/^0x[a-fA-F0-9]{40}$/)
            .withMessage('Invalid Ethereum address format'),
        body('rules')
            .isArray()
            .withMessage('Rules must be an array'),
        body('rules.*.type')
            .notEmpty()
            .withMessage('Rule type is required'),
        body('rules.*.condition')
            .notEmpty()
            .withMessage('Rule condition is required'),
    ],

    updateTaskSchema: [
        body('name')
            .optional()
            .isString()
            .withMessage('Task name must be a string'),
        body('status')
            .optional()
            .isString()
            .withMessage('Status must be a string'),
        body('rules')
            .optional()
            .isArray()
            .withMessage('Rules must be an array'),
    ],

    // DAO vote task validation
    createDaoVoteTaskSchema: [
        body('name')
            .notEmpty()
            .withMessage('Task name is required'),
        body('daoAddress')
            .notEmpty()
            .withMessage('DAO address is required')
            .matches(/^0x[a-fA-F0-9]{40}$/)
            .withMessage('Invalid Ethereum address format'),
        body('votingRule')
            .notEmpty()
            .withMessage('Voting rule is required')
            .isString()
            .withMessage('Voting rule must be a string'),
        body('walletAddress')
            .notEmpty()
            .withMessage('Wallet address is required')
            .matches(/^0x[a-fA-F0-9]{40}$/)
            .withMessage('Invalid Ethereum address format'),
    ],

    // Token purchase task validation
    createTokenPurchaseTaskSchema: [
        body('name')
            .notEmpty()
            .withMessage('Task name is required'),
        body('tokenAddress')
            .notEmpty()
            .withMessage('Token address is required')
            .matches(/^0x[a-fA-F0-9]{40}$/)
            .withMessage('Invalid Ethereum address format'),
        body('amount')
            .notEmpty()
            .withMessage('Amount is required')
            .isNumeric()
            .withMessage('Amount must be a number'),
        body('priceCondition')
            .notEmpty()
            .withMessage('Price condition is required')
            .isString()
            .withMessage('Price condition must be a string'),
        body('walletAddress')
            .notEmpty()
            .withMessage('Wallet address is required')
            .matches(/^0x[a-fA-F0-9]{40}$/)
            .withMessage('Invalid Ethereum address format'),
    ],

    // Common parameter validation
    idParamSchema: [
        param('id')
            .notEmpty()
            .withMessage('ID is required')
            .isString()
            .withMessage('ID must be a string'),
    ],

    walletAddressParamSchema: [
        param('walletAddress')
            .notEmpty()
            .withMessage('Wallet address is required')
            .matches(/^0x[a-fA-F0-9]{40}$/)
            .withMessage('Invalid Ethereum address format'),
    ],

    paginationQuerySchema: [
        query('page')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Page must be a positive integer'),
        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Limit must be between 1 and 100'),
    ],
};