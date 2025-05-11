import { cleanEnv, str, port, url, num } from 'envalid';
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Validate and extract environment variables with default values
const env = cleanEnv(process.env, {
    // Server configuration
    NODE_ENV: str({ choices: ['development', 'test', 'production'], default: 'development' }),
    PORT: port({ default: 3000 }),
    API_PREFIX: str({ default: '/api/v1' }),

    // Database configuration
    MONGODB_URI: url(),

    // Redis configuration for BullMQ
    REDIS_HOST: str({ default: 'localhost' }),
    REDIS_PORT: port({ default: 6379 }),
    REDIS_PASSWORD: str({ default: '', devDefault: '' }),

    // JWT configuration
    JWT_SECRET: str(),
    JWT_EXPIRATION: str({ default: '24h' }),

    // External API Keys
    INFURA_API_KEY: str(),
    ALCHEMY_API_KEY: str(),
    COINGECKO_API_KEY: str({ default: '' }), // Optional, as they have a free tier
    COINMARKETCAP_API_KEY: str(),

    // Rate limiting
    RATE_LIMIT_WINDOW_MS: num({ default: 15 * 60 * 1000 }), // 15 minutes
    RATE_LIMIT_MAX: num({ default: 100 }), // 100 requests per window

    // Gaia AI Agent
    GAIA_API_KEY: str(),
    GAIA_API_URL: url(),

    // Logging
    LOG_LEVEL: str({ choices: ['error', 'warn', 'info', 'http', 'debug'], default: 'info' }),
});

export default env;