import { logger } from '../config/logger.config';

/**
 * Simple in-memory rate limiter
 * For production, you would use Redis or another distributed store
 */
export default class RateLimit {
    private limits: Map<string, { count: number; resetAt: number }>;
    private defaultWindowMs: number;
    private defaultMax: number;

    constructor({ windowMs = 60000, max = 100 }) {
        this.limits = new Map();
        this.defaultWindowMs = windowMs;
        this.defaultMax = max;

        // Clean up expired entries every minute
        setInterval(() => this.cleanup(), 60000);
    }

    /**
     * Increment the counter for a key and check if limit is exceeded
     * @param key Unique identifier for the limiter
     * @param windowMs Time window in milliseconds
     * @param max Maximum requests allowed in window
     * @returns boolean indicating if limit is exceeded
     */
    async increment(key: string, windowMs: number = this.defaultWindowMs, max: number = this.defaultMax): Promise<boolean> {
        const now = Date.now();

        // Get or initialize counter
        let counter = this.limits.get(key);

        if (!counter || counter.resetAt < now) {
            // Create new counter if not exists or expired
            counter = {
                count: 0,
                resetAt: now + windowMs
            };
        }

        // Increment counter
        counter.count += 1;

        // Update in store
        this.limits.set(key, counter);

        // Check if limit exceeded
        return counter.count > max;
    }

    /**
     * Get time in seconds until rate limit reset
     * @param key Unique identifier
     * @returns seconds until reset or 0 if not found
     */
    getRetryAfter(key: string): number {
        const counter = this.limits.get(key);

        if (!counter) {
            return 0;
        }

        const now = Date.now();
        return Math.max(0, Math.ceil((counter.resetAt - now) / 1000));
    }

    /**
     * Clear a rate limit entry
     * @param key Unique identifier to clear
     */
    clear(key: string): void {
        this.limits.delete(key);
    }

    /**
     * Remove all expired rate limit entries
     */
    private cleanup(): void {
        const now = Date.now();
        let expiredCount = 0;

        for (const [key, counter] of this.limits.entries()) {
            if (counter.resetAt < now) {
                this.limits.delete(key);
                expiredCount++;
            }
        }

        if (expiredCount > 0) {
            logger.debug(`Cleaned up ${expiredCount} expired rate limit entries`);
        }
    }
}