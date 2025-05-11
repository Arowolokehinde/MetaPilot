import { logger } from '../config/logger.config';
import Task, { ExecutionStatus, TaskStatus } from '../models/task.model';
import { ActivityType, ActivityStatus } from '../models/activity.model';
import { createActivity } from '../services/activity.service';
import { getDAOProposals } from '../services/dao.service';
import { getTokenPrice } from '../services/token.service';


/**
 * Process a DAO vote task
 */
export async function processDaoVoteTask(taskData: { taskId: string;[key: string]: any }) {
    const taskId = taskData.taskId;
    let task: any;

    try {
        // Fetch the task from database to ensure we have the latest data
        task = await Task.findOne({ taskId });

        if (!task) {
            throw new Error(`Task ${taskId} not found`);
        }

        // Skip if task is not active
        if (task.status !== TaskStatus.ACTIVE) {
            logger.info(`Task ${taskId} is not active, skipping execution`);
            return { status: ExecutionStatus.NO_ACTION, message: 'Task is not active' };
        }

        // Get the DAO vote rule
        const voteRule = task.rules.find((rule: { type: string; }) => rule.type === 'dao_vote_rule');

        if (!voteRule) {
            throw new Error(`No DAO vote rule found for task ${taskId}`);
        }

        // Extract parameters
        const daoAddress = voteRule.parameters.daoAddress;
        const votingRule = voteRule.condition;
        const chainId = voteRule.parameters.chainId || 1;

        // Get DAO proposals
        const proposals = await getDAOProposals(daoAddress, chainId, 1, 10);

        // Find proposals not yet voted on
        const newProposals = proposals.proposals.filter(proposal => {
            // Check if we've already voted on this proposal
            const alreadyVoted = task.executionHistory.some(
                (record: { details: string | string[]; status: ExecutionStatus; }) => record.details?.includes(proposal.id) && record.status === ExecutionStatus.SUCCESSFUL
            );

            return !alreadyVoted && proposal.status === 'active';
        });

        if (newProposals.length === 0) {
            logger.info(`No new proposals found for DAO ${daoAddress}`);

            // Update task with last execution time
            task.lastExecuted = new Date();
            await task.save();

            return { status: ExecutionStatus.NO_ACTION, message: 'No new proposals found' };
        }

        logger.info(`Found ${newProposals.length} new proposals for DAO ${daoAddress}`);

        // Process each new proposal
        const results = [];

        for (const proposal of newProposals) {
            try {
                logger.info(`Processing proposal ${proposal.id}`);

                // Determine vote based on rule
                const voteDecision = determineVoteDecision(votingRule, proposal);

                // In a real implementation, this would call the smart contract
                // Instead, we'll just simulate the vote for the MVP
                const voteResult = await simulateVote(
                    task.walletAddress,
                    daoAddress,
                    proposal.id,
                    voteDecision.vote,
                    chainId
                );

                // Record execution in task history
                task.executionHistory.push({
                    timestamp: new Date(),
                    status: ExecutionStatus.SUCCESSFUL,
                    details: `Voted ${voteDecision.vote} on proposal ${proposal.id}: ${proposal.title}`,
                    txHash: voteResult.txHash,
                });

                // Create activity record
                await createActivity({
                    userId: task.userId,
                    walletAddress: task.walletAddress,
                    type: ActivityType.TASK_EXECUTED,
                    taskType: task.type,
                    taskId: task.taskId,
                    status: ActivityStatus.SUCCESS,
                    details: `Voted ${voteDecision.vote} on proposal: ${proposal.title}`,
                    metadata: {
                        proposalId: proposal.id,
                        daoAddress,
                        voteDecision: voteDecision.vote,
                        reasoning: voteDecision.reasoning,
                    },
                    txHash: voteResult.txHash,
                    chainId,
                });

                results.push({
                    proposalId: proposal.id,
                    vote: voteDecision.vote,
                    success: true,
                });
            } catch (error: any) {
                logger.error(`Error processing proposal ${proposal.id}:`, error);

                // Record failure in task history
                task.executionHistory.push({
                    timestamp: new Date(),
                    status: ExecutionStatus.FAILED,
                    details: `Failed to vote on proposal ${proposal.id}: ${proposal.title}`,
                    errorMessage: error.message,
                });

                // Create activity record for failure
                await createActivity({
                    userId: task.userId,
                    walletAddress: task.walletAddress,
                    type: ActivityType.TASK_EXECUTED,
                    taskType: task.type,
                    taskId: task.taskId,
                    status: ActivityStatus.FAILED,
                    details: `Failed to vote on proposal: ${proposal.title}`,
                    metadata: {
                        proposalId: proposal.id,
                        daoAddress,
                        error: error.message,
                    },
                    chainId,
                });

                results.push({
                    proposalId: proposal.id,
                    success: false,
                    error: error.message,
                });
            }
        }

        // Update task with last execution time
        task.lastExecuted = new Date();
        await task.save();

        return {
            status: ExecutionStatus.SUCCESSFUL,
            message: `Processed ${newProposals.length} proposals`,
            results,
        };
    } catch (error: any) {
        logger.error(`Error processing DAO vote task ${taskId}:`, error);

        // Record error in task history if task exists
        if (task) {
            task.executionHistory.push({
                timestamp: new Date(),
                status: ExecutionStatus.FAILED,
                details: 'Failed to process DAO vote task',
                errorMessage: error.message,
            });

            task.lastExecuted = new Date();
            await task.save();

            // Create activity record for failure
            await createActivity({
                userId: task.userId,
                walletAddress: task.walletAddress,
                type: ActivityType.TASK_EXECUTED,
                taskType: task.type,
                taskId: task.taskId,
                status: ActivityStatus.FAILED,
                details: 'Failed to process DAO vote task',
                metadata: {
                    error: error.message,
                },
            });
        }

        return {
            status: ExecutionStatus.FAILED,
            message: `Error processing task: ${error.message}`,
        };
    }
}

/**
 * Process a token purchase task
 */
export async function processTokenPurchaseTask(taskData: any) {
    const taskId = taskData.taskId;
    let task;

    try {
        // Fetch the task from database to ensure we have the latest data
        task = await Task.findOne({ taskId });

        if (!task) {
            throw new Error(`Task ${taskId} not found`);
        }

        // Skip if task is not active
        if (task.status !== TaskStatus.ACTIVE) {
            logger.info(`Task ${taskId} is not active, skipping execution`);
            return { status: ExecutionStatus.NO_ACTION, message: 'Task is not active' };
        }

        // Get the token price rule
        const priceRule = task.rules.find(rule => rule.type === 'token_price_rule');

        if (!priceRule) {
            throw new Error(`No token price rule found for task ${taskId}`);
        }

        // Extract parameters
        const tokenAddress = priceRule.parameters.tokenAddress;
        const amount = parseFloat(priceRule.parameters.amount);
        const priceCondition = priceRule.condition;
        const maxPrice = parseFloat(priceRule.parameters.maxPrice || '0');
        const chainId = priceRule.parameters.chainId || 1;
        const tokenSymbol = priceRule.parameters.tokenSymbol || 'Unknown';

        // Get token price
        const priceData = await getTokenPrice(tokenAddress, chainId);

        // Check if price condition is met
        const conditionMet = checkPriceCondition(
            priceData.price,
            priceCondition,
            maxPrice,
            priceData.previousPrice
        );

        if (!conditionMet.met) {
            logger.info(`Price condition not met for token ${tokenAddress}. Current price: ${priceData.price}`);

            // Update task with last execution time
            task.lastExecuted = new Date();
            await task.save();

            return {
                status: ExecutionStatus.NO_ACTION,
                message: `Price condition not met. ${conditionMet.reason}`
            };
        }

        logger.info(`Price condition met for token ${tokenAddress}. Current price: ${priceData.price}`);

        // In a real implementation, this would call the smart contract via Gaia
        // Instead, we'll just simulate the purchase for the MVP
        const purchaseResult = await simulateTokenPurchase(
            task.walletAddress,
            tokenAddress,
            amount,
            priceData.price,
            chainId
        );

        // Record execution in task history
        task.executionHistory.push({
            timestamp: new Date(),
            status: ExecutionStatus.SUCCESSFUL,
            details: `Purchased ${amount} ${tokenSymbol} at price $${priceData.price}`,
            txHash: purchaseResult.txHash,
            gasUsed: purchaseResult.gasUsed,
        });

        // Create activity record
        await createActivity({
            userId: task.userId,
            walletAddress: task.walletAddress,
            type: ActivityType.TASK_EXECUTED,
            taskType: task.type,
            taskId: task.taskId,
            status: ActivityStatus.SUCCESS,
            details: `Purchased ${amount} ${tokenSymbol} at price $${priceData.price}`,
            metadata: {
                tokenAddress,
                tokenSymbol,
                amount,
                price: priceData.price,
                conditionMet: conditionMet.reason,
            },
            txHash: purchaseResult.txHash,
            chainId,
        });

        // If this is a one-time purchase, mark task as completed
        if (priceCondition.toLowerCase().includes('once')) {
            task.status = TaskStatus.COMPLETED;
        }

        // Update task with last execution time
        task.lastExecuted = new Date();
        await task.save();

        return {
            status: ExecutionStatus.SUCCESSFUL,
            message: `Purchased ${amount} ${tokenSymbol} at price $${priceData.price}`,
            details: purchaseResult,
        };
    } catch (error: any) {
        logger.error(`Error processing token purchase task ${taskId}:`, error);

        // Record error in task history if task exists
        if (task) {
            task.executionHistory.push({
                timestamp: new Date(),
                status: ExecutionStatus.FAILED,
                details: 'Failed to process token purchase task',
                errorMessage: error.message,
            });

            task.lastExecuted = new Date();
            await task.save();

            // Create activity record for failure
            await createActivity({
                userId: task.userId,
                walletAddress: task.walletAddress,
                type: ActivityType.TASK_EXECUTED,
                taskType: task.type,
                taskId: task.taskId,
                status: ActivityStatus.FAILED,
                details: 'Failed to process token purchase task',
                metadata: {
                    error: error.message,
                },
            });
        }

        return {
            status: ExecutionStatus.FAILED,
            message: `Error processing task: ${error.message}`,
        };
    }
}

/**
 * Placeholder implementations for other task processors
 * In a real implementation, these would have full logic similar to the above
 */
export async function processTokenSwapTask(taskData: any) {
    // Simple placeholder implementation
    return simulateTaskExecution(taskData, 'token swap');
}

export async function processStakingTask(taskData: any) {
    // Simple placeholder implementation
    return simulateTaskExecution(taskData, 'staking');
}

export async function processLiquidityTask(taskData: any) {
    // Simple placeholder implementation
    return simulateTaskExecution(taskData, 'liquidity provision');
}

export async function processNftPurchaseTask(taskData: any) {
    // Simple placeholder implementation
    return simulateTaskExecution(taskData, 'NFT purchase');
}

export async function processYieldOptimizationTask(taskData: any) {
    // Simple placeholder implementation
    return simulateTaskExecution(taskData, 'yield optimization');
}

export async function processRewardClaimTask(taskData: any) {
    // Simple placeholder implementation
    return simulateTaskExecution(taskData, 'reward claim');
}

/**
 * Helper function to determine vote decision based on rule
 */
function determineVoteDecision(rule: string, proposal: any) {
    // Simple keyword matching for simulation purposes
    // In production, this would use NLP for better analysis
    const fullText = `${proposal.title} ${proposal.description || ''}`.toLowerCase();

    // Parse the rule
    const voteYesMatch = rule.match(/vote yes if (.*)/i);
    const voteNoMatch = rule.match(/vote no if (.*)/i);

    if (voteYesMatch) {
        const condition = voteYesMatch[1].toLowerCase();
        const keywords = condition.split(' ').filter(keyword => keyword.length > 2);

        const matchedKeywords = keywords.filter(keyword => fullText.includes(keyword));

        if (matchedKeywords.length > 0) {
            return {
                vote: 'YES',
                reasoning: `Matched keywords: ${matchedKeywords.join(', ')}`,
            };
        } else {
            return {
                vote: 'NO',
                reasoning: `Did not match any keywords for YES condition: ${keywords.join(', ')}`,
            };
        }
    } else if (voteNoMatch) {
        const condition = voteNoMatch[1].toLowerCase();
        const keywords = condition.split(' ').filter(keyword => keyword.length > 2);

        const matchedKeywords = keywords.filter(keyword => fullText.includes(keyword));

        if (matchedKeywords.length > 0) {
            return {
                vote: 'NO',
                reasoning: `Matched keywords: ${matchedKeywords.join(', ')}`,
            };
        } else {
            return {
                vote: 'YES',
                reasoning: `Did not match any keywords for NO condition: ${keywords.join(', ')}`,
            };
        }
    } else {
        // Default
        return {
            vote: 'ABSTAIN',
            reasoning: 'No matching rule pattern found',
        };
    }
}

/**
 * Helper function to check price conditions
 */
function checkPriceCondition(
    currentPrice: number,
    condition: string,
    maxPrice: number,
    previousPrice: number
): { met: boolean; reason: string } {
    // Check if max price is set and current price exceeds it
    if (maxPrice > 0 && currentPrice > maxPrice) {
        return {
            met: false,
            reason: `Current price $${currentPrice} exceeds max price $${maxPrice}`
        };
    }

    // Parse the condition
    if (condition.includes('increases by')) {
        const percentMatch = condition.match(/increases by ([0-9.]+)%/);
        if (percentMatch) {
            const targetPercent = parseFloat(percentMatch[1]);
            const actualPercent = ((currentPrice - previousPrice) / previousPrice) * 100;

            if (actualPercent >= targetPercent) {
                return {
                    met: true,
                    reason: `Price increased by ${actualPercent.toFixed(2)}% (target: ${targetPercent}%)`
                };
            } else {
                return {
                    met: false,
                    reason: `Price increased by only ${actualPercent.toFixed(2)}% (target: ${targetPercent}%)`
                };
            }
        }
    } else if (condition.includes('decreases by')) {
        const percentMatch = condition.match(/decreases by ([0-9.]+)%/);
        if (percentMatch) {
            const targetPercent = parseFloat(percentMatch[1]);
            const actualPercent = ((previousPrice - currentPrice) / previousPrice) * 100;

            if (actualPercent >= targetPercent) {
                return {
                    met: true,
                    reason: `Price decreased by ${actualPercent.toFixed(2)}% (target: ${targetPercent}%)`
                };
            } else {
                return {
                    met: false,
                    reason: `Price decreased by only ${actualPercent.toFixed(2)}% (target: ${targetPercent}%)`
                };
            }
        }
    } else if (condition.includes('drops below')) {
        const priceMatch = condition.match(/drops below ([0-9.]+)/);
        if (priceMatch) {
            const targetPrice = parseFloat(priceMatch[1]);

            if (currentPrice < targetPrice) {
                return {
                    met: true,
                    reason: `Price $${currentPrice} is below target $${targetPrice}`
                };
            } else {
                return {
                    met: false,
                    reason: `Price $${currentPrice} is not below target $${targetPrice}`
                };
            }
        }
    } else if (condition.includes('rises above')) {
        const priceMatch = condition.match(/rises above ([0-9.]+)/);
        if (priceMatch) {
            const targetPrice = parseFloat(priceMatch[1]);

            if (currentPrice > targetPrice) {
                return {
                    met: true,
                    reason: `Price $${currentPrice} is above target $${targetPrice}`
                };
            } else {
                return {
                    met: false,
                    reason: `Price $${currentPrice} is not above target $${targetPrice}`
                };
            }
        }
    }

    // Default
    return {
        met: false,
        reason: `Condition "${condition}" is not recognized or not met`
    };
}

/**
 * Simulate voting on a DAO proposal
 * This is a placeholder for the real implementation that would call the smart contract
 */
async function simulateVote(
    walletAddress: string,
    daoAddress: string,
    proposalId: string,
    vote: string,
    chainId: number
) {
    // Simulate a delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate a fake transaction hash
    const txHash = `0x${Math.random().toString(16).substr(2, 64)}`;

    logger.info(`Simulated vote ${vote} on proposal ${proposalId} by ${walletAddress}`);

    return {
        txHash,
        success: true,
        vote,
    };
}

/**
 * Simulate a token purchase
 * This is a placeholder for the real implementation that would call the smart contract
 */
async function simulateTokenPurchase(
    walletAddress: string,
    tokenAddress: string,
    amount: number,
    price: number,
    chainId: number
) {
    // Simulate a delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate a fake transaction hash
    const txHash = `0x${Math.random().toString(16).substr(2, 64)}`;

    // Generate a random gas used amount
    const gasUsed = Math.floor(Math.random() * 200000) + 50000;

    logger.info(`Simulated purchase of ${amount} tokens at $${price} by ${walletAddress}`);

    return {
        txHash,
        success: true,
        gasUsed,
        amount,
        pricePerToken: price,
        totalCost: amount * price,
    };
}

/**
 * Helper function to simulate generic task execution
 */
async function simulateTaskExecution(taskData: any, taskName: string) {
    const taskId = taskData.taskId;
    let task;

    try {
        // Fetch the task from database
        task = await Task.findOne({ taskId });

        if (!task) {
            throw new Error(`Task ${taskId} not found`);
        }

        // Skip if task is not active
        if (task.status !== TaskStatus.ACTIVE) {
            logger.info(`Task ${taskId} is not active, skipping execution`);
            return { status: ExecutionStatus.NO_ACTION, message: 'Task is not active' };
        }

        // Simulate a successful execution
        logger.info(`Simulating ${taskName} task execution for ${taskId}`);

        // Generate a fake transaction hash
        const txHash = `0x${Math.random().toString(16).substr(2, 64)}`;

        // Update task history
        task.executionHistory.push({
            timestamp: new Date(),
            status: ExecutionStatus.SUCCESSFUL,
            details: `Simulated ${taskName} task execution`,
            txHash,
        });

        // Update task with last execution time
        task.lastExecuted = new Date();
        await task.save();

        // Create activity record
        await createActivity({
            userId: task.userId,
            walletAddress: task.walletAddress,
            type: ActivityType.TASK_EXECUTED,
            taskType: task.type,
            taskId: task.taskId,
            status: ActivityStatus.SUCCESS,
            details: `Executed ${taskName} task successfully`,
            txHash,
        });

        return {
            status: ExecutionStatus.SUCCESSFUL,
            message: `Simulated ${taskName} task execution`,
            txHash,
        };
    } catch (error: any) {
        logger.error(`Error processing ${taskName} task ${taskId}:`, error);

        // Record error in task history if task exists
        if (task) {
            task.executionHistory.push({
                timestamp: new Date(),
                status: ExecutionStatus.FAILED,
                details: `Failed to process ${taskName} task`,
                errorMessage: error.message,
            });

            task.lastExecuted = new Date();
            await task.save();

            // Create activity record for failure
            await createActivity({
                userId: task.userId,
                walletAddress: task.walletAddress,
                type: ActivityType.TASK_EXECUTED,
                taskType: task.type,
                taskId: task.taskId,
                status: ActivityStatus.FAILED,
                details: `Failed to process ${taskName} task`,
                metadata: {
                    error: error.message,
                },
            });
        }

        return {
            status: ExecutionStatus.FAILED,
            message: `Error processing task: ${error.message}`,
        };
    }
}