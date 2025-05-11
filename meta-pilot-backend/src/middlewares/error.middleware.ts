import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger.config';
import { AppError, ValidationError } from '../utils/errors';
import env from '../config/env.config';

// Central error handler middleware
export const errorMiddleware = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    // Default error status and message
    let statusCode = 500;
    let message = 'Internal Server Error';
    let errors: Record<string, string> = {};

    // Handle AppError instances (our custom errors)
    if (err instanceof AppError) {
        statusCode = err.statusCode;
        message = err.message;

        // Handle validation errors with field details
        if (err instanceof ValidationError) {
            errors = err.errors;
        }
    }
    // Handle Mongoose validation errors
    else if (err.name === 'ValidationError' && 'errors' in err) {
        statusCode = 400;
        message = 'Validation Error';

        // Extract field-specific errors
        const mongooseErrors = err.errors as {
            [key: string]: { message: string };
        };

        for (const [field, error] of Object.entries(mongooseErrors)) {
            errors[field] = error.message;
        }
    }
    // Handle JWT errors
    else if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
    }
    else if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
    }

    // Log the error
    if (statusCode >= 500) {
        logger.error({
            message: `${statusCode} - ${message}`,
            error: err.stack,
            path: req.path,
            method: req.method,
        });
    } else {
        logger.warn({
            message: `${statusCode} - ${message}`,
            path: req.path,
            method: req.method,
        });
    }

    // Send error response
    res.status(statusCode).json({
        status: 'error',
        message,
        errors: Object.keys(errors).length > 0 ? errors : undefined,
        stack: env.NODE_ENV === 'development' ? err.stack : undefined,
    });
};

// 404 handler for routes that don't exist
export const notFoundMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const err = new AppError(`Not Found - ${req.originalUrl}`, 404);
    next(err);
};

// Async handler to avoid try/catch blocks in route handlers
export const asyncHandler = (fn: Function) => (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    return Promise.resolve(fn(req, res, next)).catch(next);
};