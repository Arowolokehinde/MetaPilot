import { Request, Response } from 'express';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { asyncHandler } from '../middlewares/error.middleware';
import { getActivity, getTaskActivities, getUserActivities, getWalletActivities } from '../services/activity.service';
import Activity from '../models/activity.model';


/**
 * Get user activities
 * @route GET /api/v1/activities
 */
export const getUserActivitiesHandler = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
        if (!req.user) {
            throw new ForbiddenError('Authentication required');
        }

        // Parse pagination parameters
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        // Parse filters
        const filters: Record<string, any> = {};

        if (req.query.type) {
            filters.type = req.query.type;
        }

        if (req.query.status) {
            filters.status = req.query.status;
        }

        if (req.query.taskType) {
            filters.taskType = req.query.taskType;
        }

        if (req.query.taskId) {
            filters.taskId = req.query.taskId;
        }

        if (req.query.fromDate && req.query.toDate) {
            filters.timestamp = {
                $gte: new Date(req.query.fromDate as string),
                $lte: new Date(req.query.toDate as string),
            };
        } else if (req.query.fromDate) {
            filters.timestamp = {
                $gte: new Date(req.query.fromDate as string),
            };
        } else if (req.query.toDate) {
            filters.timestamp = {
                $lte: new Date(req.query.toDate as string),
            };
        }

        // Get activities
        const result = await getUserActivities(
            req.user.userId,
            page,
            limit,
            filters
        );

        res.status(200).json({
            status: 'success',
            data: {
                activities: result.activities,
                pagination: {
                    total: result.total,
                    page: result.page,
                    totalPages: result.totalPages,
                },
            },
        });
    }
);

/**
 * Get wallet activities
 * @route GET /api/v1/activities/wallet/:walletAddress
 */
export const getWalletActivitiesHandler = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
        if (!req.user) {
            throw new ForbiddenError('Authentication required');
        }

        const { walletAddress } = req.params;

        // Ensure user owns the wallet
        if (walletAddress.toLowerCase() !== req.user.walletAddress.toLowerCase()) {
            throw new ForbiddenError('You do not have permission to access activities for this wallet');
        }

        // Parse pagination parameters
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        // Parse filters
        const filters: Record<string, any> = {};

        if (req.query.type) {
            filters.type = req.query.type;
        }

        if (req.query.status) {
            filters.status = req.query.status;
        }

        if (req.query.taskType) {
            filters.taskType = req.query.taskType;
        }

        if (req.query.taskId) {
            filters.taskId = req.query.taskId;
        }

        if (req.query.fromDate && req.query.toDate) {
            filters.timestamp = {
                $gte: new Date(req.query.fromDate as string),
                $lte: new Date(req.query.toDate as string),
            };
        } else if (req.query.fromDate) {
            filters.timestamp = {
                $gte: new Date(req.query.fromDate as string),
            };
        } else if (req.query.toDate) {
            filters.timestamp = {
                $lte: new Date(req.query.toDate as string),
            };
        }

        // Get activities
        const result = await getWalletActivities(
            walletAddress,
            page,
            limit,
            filters
        );

        res.status(200).json({
            status: 'success',
            data: {
                activities: result.activities,
                pagination: {
                    total: result.total,
                    page: result.page,
                    totalPages: result.totalPages,
                },
            },
        });
    }
);

/**
 * Get task activities
 * @route GET /api/v1/activities/task/:taskId
 */
export const getTaskActivitiesHandler = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
        if (!req.user) {
            throw new ForbiddenError('Authentication required');
        }

        const { taskId } = req.params;

        // Parse pagination parameters
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        // Get activities
        const result = await getTaskActivities(
            taskId,
            page,
            limit
        );

        res.status(200).json({
            status: 'success',
            data: {
                activities: result.activities,
                pagination: {
                    total: result.total,
                    page: result.page,
                    totalPages: result.totalPages,
                },
            },
        });
    }
);

/**
 * Get activity by ID
 * @route GET /api/v1/activities/:activityId
 */
export const getActivityHandler = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
        if (!req.user) {
            throw new ForbiddenError('Authentication required');
        }

        const { activityId } = req.params;

        // Get activity
        const activity = await getActivity(activityId);

        if (!activity) {
            throw new NotFoundError('Activity not found');
        }

        // Ensure user owns the activity
        if (activity.userId !== req.user.userId) {
            throw new ForbiddenError('You do not have permission to access this activity');
        }

        res.status(200).json({
            status: 'success',
            data: {
                activity,
            },
        });
    }
);

/**
 * Get activity dashboard summary
 * @route GET /api/v1/activities/dashboard
 */
export const getActivityDashboard = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
        if (!req.user) {
            throw new ForbiddenError('Authentication required');
        }

        // Get recent activities (last 5)
        const recentActivities = await getUserActivities(
            req.user.userId,
            1,
            5
        );

        // Get task type distribution
        const taskTypeDistribution = await getTaskTypeDistribution(req.user.userId);

        // Get activity statistics
        const activityStats = await getActivityStatistics(req.user.userId);

        res.status(200).json({
            status: 'success',
            data: {
                recentActivities: recentActivities.activities,
                taskTypeDistribution,
                activityStats,
            },
        });
    }
);

/**
 * Helper function to get task type distribution
 */
async function getTaskTypeDistribution(userId: string) {
    // Aggregate activities by task type
    const distribution = await Activity.aggregate([
        { $match: { userId } },
        { $group: { _id: '$taskType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
    ]);

    return distribution.map(item => ({
        taskType: item._id,
        count: item.count,
    }));
}

/**
 * Helper function to get activity statistics
 */
async function getActivityStatistics(userId: string) {
    // Get total activities count
    const totalActivities = await Activity.countDocuments({ userId });

    // Get success/failure counts
    const successCount = await Activity.countDocuments({
        userId,
        status: 'success',
    });

    const failureCount = await Activity.countDocuments({
        userId,
        status: 'failed',
    });

    // Get counts by activity type
    const typeStats = await Activity.aggregate([
        { $match: { userId } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);

    // Get counts for last 7 days
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const lastSevenDaysStats = await Activity.aggregate([
        {
            $match: {
                userId,
                timestamp: { $gte: sevenDaysAgo },
            },
        },
        {
            $group: {
                _id: {
                    $dateToString: {
                        format: '%Y-%m-%d',
                        date: '$timestamp',
                    },
                },
                count: { $sum: 1 },
            },
        },
        { $sort: { _id: 1 } },
    ]);

    return {
        totalActivities,
        successCount,
        failureCount,
        successRate: totalActivities > 0 ? (successCount / totalActivities) * 100 : 0,
        typeStats: typeStats.map(item => ({
            type: item._id,
            count: item.count,
        })),
        dailyStats: lastSevenDaysStats.map(item => ({
            date: item._id,
            count: item.count,
        })),
    };
}