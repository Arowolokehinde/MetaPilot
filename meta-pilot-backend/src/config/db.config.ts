import mongoose from 'mongoose';
import { logger } from './logger.config';
import env from './env.config';

// Configure Mongoose
mongoose.set('strictQuery', true);
mongoose.set('toJSON', {
    virtuals: true,
    transform: (_, ret) => {
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});

// Database connection options
const dbOptions: mongoose.ConnectOptions = {
    serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    autoIndex: env.NODE_ENV !== 'production', // Don't build indexes in production
};

// Connect to MongoDB
export const connectToDatabase = async (): Promise<void> => {
    try {
        await mongoose.connect(env.MONGODB_URI, dbOptions);
        logger.info('MongoDB connection established successfully');
    } catch (error) {
        logger.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

// Disconnect from MongoDB
export const disconnectFromDatabase = async (): Promise<void> => {
    try {
        await mongoose.disconnect();
        logger.info('MongoDB disconnected');
    } catch (error) {
        logger.error('Error disconnecting from MongoDB:', error);
        process.exit(1);
    }
};

// Connection events
mongoose.connection.on('connected', () => {
    logger.info('MongoDB connected');
});

mongoose.connection.on('error', (err) => {
    logger.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    logger.info('MongoDB disconnected');
});