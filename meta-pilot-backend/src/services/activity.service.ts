import Activity, { IActivity, ActivityType, ActivityStatus } from '../models/activity.model';
import { TaskType } from '../models/task.model';
import { logger } from '../config/logger.config';

/**
 * Interface for creating an activity
 */
interface CreateActivityParams {
    userId: string;
    walletAddress: string;
    type: ActivityType;
    taskType?: TaskType;
    taskId?: string;
    status: ActivityStatus;
    details: string;
    metadata?: Record<string, any>;
    txHash?: string;
    chainId?: number;
}

/**
 * Create an activity record
 */
export const createActivity = async (params: CreateActivityParams): Promise<IActivity> => {
    try {
        const activity = await Activity.create({
            activityId: `act_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`,
            userId: params.userId,
            walletAddress: params.walletAddress.toLowerCase(),
            type: params.type,
            taskType: params.taskType,
            taskId: params.taskId,
            status: params.status,
            details: params.details,
            metadata: params.metadata || {},
            timestamp: new Date(),
            txHash: params.txHash,
            chainId: params.chainId,
        });

        return activity;
    } catch (error: any) {
        logger.error('Error creating activity record:', error);
        // Create a fallback activity in case of DB errors
        return {
            activityId: `err_${Date.now().toString(36)}`,
            userId: params.userId,
            walletAddress: params.walletAddress.toLowerCase(),
            type: params.type,
            taskType: params.taskType,
            taskId: params.taskId,
            status: ActivityStatus.FAILED,
            details: 'Failed to record activity',
            metadata: { originalDetails: params.details, error: error.message },
            timestamp: new Date(),
        } as any;
    }
};

/**
 * Get wallet activities
 */
export const getWalletActivities = async (
    walletAddress: string,
    page: number = 1,
    limit: number = 20,
    filters: Record<string, any> = {}
): Promise<{ activities: IActivity[]; total: number; page: number; totalPages: number }> => {
    const skip = (page - 1) * limit;

    // Normalize wallet address
    const normalizedWalletAddress = walletAddress.toLowerCase();

    // Build filters
    const queryFilters = { walletAddress: normalizedWalletAddress, ...filters };

    // Count total documents
    const total = await Activity.countDocuments(queryFilters);

    // Get activities
    const activities = await Activity.find(queryFilters)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit);

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    return {
        activities,
        total,
        page,
        totalPages,
    };
};

/**
 * Get task activities
 */
export const getTaskActivities = async (
    taskId: string,
    page: number = 1,
    limit: number = 20
): Promise<{ activities: IActivity[]; total: number; page: number; totalPages: number }> => {
    const skip = (page - 1) * limit;

    // Build filters
    const queryFilters = { taskId };

    // Count total documents
    const total = await Activity.countDocuments(queryFilters);

    // Get activities
    const activities = await Activity.find(queryFilters)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit);

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    return {
        activities,
        total,
        page,
        totalPages,
    };
};

/**
 * Get activity by ID
 */
export const getActivity = async (activityId: string): Promise<IActivity | null> => {
    return Activity.findOne({ activityId });
};

export const getUserActivities = async (
    userId: string,
    page: number = 1,
    limit: number = 20,
    filters: Record<string, any> = {}
): Promise<{ activities: IActivity[]; total: number; page: number; totalPages: number }> => {
    const skip = (page - 1) * limit;

    // Build filters
    const queryFilters = { userId, ...filters };

    // Count total documents
    const total = await Activity.countDocuments(queryFilters);

    // Get activities
    const activities = await Activity.find(queryFilters)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit);

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    return {
        activities,
        total,
        page,
        totalPages,
    };
};

