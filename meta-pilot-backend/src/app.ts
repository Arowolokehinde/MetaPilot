import express, { Express } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';

// Configuration imports
import env from './config/env.config';
import { logger } from './config/logger.config';

// Middleware imports
import { errorMiddleware } from './middlewares/error.middleware';

// Routes imports
import authRoutes from './routes/auth.routes';
import taskRoutes from './routes/task.routes';
import daoRoutes from './routes/dao.routes';
import tokenRoutes from './routes/token.routes';
import stakingRoutes from './routes/staking.routes';
import liquidityRoutes from './routes/liquidity.routes';
import activityRoutes from './routes/activity.routes';
import apiKeyRoutes from './routes/api-key.routes';

// Queue processor imports
import { initializeQueues } from './queues/queue.provider';
import { startScheduler } from './queues/scheduler';

// Create Express app
const app: Express = express();

// Apply middlewares
app.use(helmet()); // Set security headers
app.use(compression()); // Compress responses
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON request body
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request body
app.use(morgan('dev')); // HTTP request logger

// Apply API routes
const apiPrefix = env.API_PREFIX;
app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/tasks`, taskRoutes);
app.use(`${apiPrefix}/dao`, daoRoutes);
app.use(`${apiPrefix}/tokens`, tokenRoutes);
app.use(`${apiPrefix}/staking`, stakingRoutes);
app.use(`${apiPrefix}/liquidity`, liquidityRoutes);
app.use(`${apiPrefix}/activities`, activityRoutes);
app.use(`${apiPrefix}/api-keys`, apiKeyRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Apply error handling middleware
app.use(errorMiddleware);

// Connect to MongoDB
mongoose
    .connect(env.MONGODB_URI)
    .then(() => {
        logger.info('Connected to MongoDB');

        // Initialize task queues
        initializeQueues();

        // Start task scheduler
        startScheduler();

        // Start the server
        const PORT = env.PORT;
        app.listen(PORT, () => {
            logger.info(`Server is running on port ${PORT}`);
        });
    })
    .catch((error) => {
        logger.error('MongoDB connection error:', error);
        process.exit(1);
    });

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

export default app;