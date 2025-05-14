import mongoose from 'mongoose';
import { logger } from '../utils/logger';

const connectDB = async (): Promise<void> => {
  try {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/metapilot';
    
    await mongoose.connect(MONGO_URI);
    
    logger.info(`MongoDB Connected: ${mongoose.connection.host}`);
  } catch (error: any) {
    logger.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;