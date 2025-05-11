/**
 * Custom error classes for the application
 */

// Base application error
export class AppError extends Error {
    statusCode: number;
    isOperational: boolean;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true; // Indicates whether this is an operational error that we can anticipate

        Error.captureStackTrace(this, this.constructor);
    }
}

// 400: Bad Request - when client sends invalid data
export class BadRequestError extends AppError {
    constructor(message: string = 'Bad request') {
        super(message, 400);
    }
}

// 401: Unauthorized - when authentication is required but failed or not provided
export class UnauthorizedError extends AppError {
    constructor(message: string = 'Authentication required') {
        super(message, 401);
    }
}

// 403: Forbidden - when user doesn't have permission for the requested resource
export class ForbiddenError extends AppError {
    constructor(message: string = 'Access forbidden') {
        super(message, 403);
    }
}

// 404: Not Found - when requested resource doesn't exist
export class NotFoundError extends AppError {
    constructor(message: string = 'Resource not found') {
        super(message, 404);
    }
}

// 409: Conflict - when request conflicts with current state of server
export class ConflictError extends AppError {
    constructor(message: string = 'Resource conflict') {
        super(message, 409);
    }
}

// 429: Too Many Requests - when user has sent too many requests
export class TooManyRequestsError extends AppError {
    constructor(message: string = 'Too many requests') {
        super(message, 429);
    }
}

// 500: Internal Server Error - unexpected server errors
export class InternalServerError extends AppError {
    constructor(message: string = 'Internal server error') {
        super(message, 500);
    }
}

// 502: Bad Gateway - when upstream server gives invalid response
export class BadGatewayError extends AppError {
    constructor(message: string = 'Bad gateway') {
        super(message, 502);
    }
}

// 503: Service Unavailable - when server is temporarily unable to handle request
export class ServiceUnavailableError extends AppError {
    constructor(message: string = 'Service unavailable') {
        super(message, 503);
    }
}

// Web3 specific errors
export class Web3Error extends AppError {
    code: string;

    constructor(message: string, statusCode: number = 400, code: string = 'WEB3_ERROR') {
        super(message, statusCode);
        this.code = code;
    }
}

// Validation errors
export class ValidationError extends AppError {
    errors: Record<string, string>;

    constructor(message: string = 'Validation failed', errors: Record<string, string> = {}) {
        super(message, 400);
        this.errors = errors;
    }
}