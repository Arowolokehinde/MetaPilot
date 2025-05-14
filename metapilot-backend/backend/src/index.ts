// backend/src/index.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import connectDB from './config/database';
import { logger } from './utils/logger';
import dtkRoutes from './api/routes/dtkRoutes';
import taskRoutes from './api/routes/taskRoutes';
import { scheduleTaskMonitoring } from './processors/TaskMonitorProcessor';

// Import processors to ensure they're initialized
import './processors/TaskExecutionProcessor';
import './processors/RuleProcessingProcessor';

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 3000;

// Validate required environment variables
function validateEnvironment() {
  const requiredVars = [
    'SEPOLIA_RPC_URL',
    'ETH_TRANSFER_EXECUTOR_ADDRESS',
    'SESSION_KEY_ENCRYPTION_KEY',
    'REDIS_URL'
  ];
  
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    logger.warn(`Missing environment variables: ${missing.join(', ')}`);
    logger.warn('Some features may not work properly without these variables.');
  } else {
    logger.info('All required environment variables are set.');
  }
}

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/dtk', dtkRoutes);
app.use('/api/tasks', taskRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'MetaPilot ETH Transfer API is running',
    network: 'sepolia',
    version: '1.0.0-mvp'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
});

// Start server and initialize task monitoring
app.listen(PORT, () => {
  logger.info(`MetaPilot ETH Transfer API running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Network: Sepolia`);
  
  // Validate environment variables
  validateEnvironment();
  
  // Start task monitoring
  scheduleTaskMonitoring();
  logger.info('Task monitoring service started successfully');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  logger.error('Unhandled Rejection:', err);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});