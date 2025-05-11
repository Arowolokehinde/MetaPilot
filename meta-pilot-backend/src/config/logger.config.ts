import winston from 'winston';
import env from './env.config';

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// Create logger instance
export const logger = winston.createLogger({
    level: env.LOG_LEVEL,
    format: logFormat,
    defaultMeta: { service: 'metapilot-backend' },
    transports: [
        // Write logs with level 'error' and below to error.log
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        // Write all logs to combined.log
        new winston.transports.File({ filename: 'logs/combined.log' }),
    ],
    exceptionHandlers: [
        new winston.transports.File({ filename: 'logs/exceptions.log' }),
    ],
    rejectionHandlers: [
        new winston.transports.File({ filename: 'logs/rejections.log' }),
    ],
});

// If we're not in production, also log to the console with a prettier format
if (env.NODE_ENV !== 'production') {
    logger.add(
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                winston.format.printf(({ timestamp, level, message, ...meta }) => {
                    return `${timestamp} ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
                        }`;
                })
            ),
        })
    );
}

// Function to log HTTP requests
export const httpLogger = (req: any, res: any, next: any) => {
    const startHrTime = process.hrtime();

    res.on('finish', () => {
        const elapsedHrTime = process.hrtime(startHrTime);
        const elapsedTimeInMs = elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1e6;

        logger.http({
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            responseTime: elapsedTimeInMs.toFixed(3) + 'ms',
            userIP: req.ip,
            userAgent: req.get('User-Agent'),
        });
    });

    next();
};