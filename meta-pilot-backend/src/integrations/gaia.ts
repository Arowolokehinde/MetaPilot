import axios from 'axios';
import { logger } from '../config/logger.config';
import env from '../config/env.config';

// Interface for an ERC-7715 action
export interface Action {
    target: string;       // Contract address to call
    value: string;        // Amount of ETH to send
    data: string;         // Calldata
    operation: number;    // Type of operation (0=Call, 1=DelegateCall)
    gasLimit: string;     // Gas limit for the transaction
    nonce: string;        // Nonce of the transaction
    deadline: string;     // Deadline timestamp
}

// Interface for Gaia response
export interface GaiaResponse {
    success: boolean;
    data?: any;
    error?: string;
    txHash?: string;
    status?: string;
}

/**
 * Initialize Gaia client
 */
const gaiaClient = axios.create({
    baseURL: env.GAIA_API_URL,
    headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.GAIA_API_KEY,
    },
});

/**
 * Execute an action via Gaia
 */
export async function executeAction(
    walletAddress: string,
    sessionKey: string,
    action: Action,
    metadata: Record<string, any> = {}
): Promise<GaiaResponse> {
    try {
        logger.info(`Executing action via Gaia for wallet ${walletAddress}`);

        const response = await gaiaClient.post('/actions/execute', {
            walletAddress,
            sessionKey,
            action,
            metadata: {
                app: 'MetaPilot',
                source: 'backend',
                ...metadata,
            },
        });

        logger.info(`Gaia action execution successful: ${JSON.stringify(response.data)}`);

        return {
            success: true,
            data: response.data,
            txHash: response.data.txHash,
            status: response.data.status,
        };
    } catch (error: any) {
        logger.error(`Error executing action via Gaia:`, error);

        return {
            success: false,
            error: error.response?.data?.message || error.message,
        };
    }
}

/**
 * Prepare an action for DAO voting
 */
export async function prepareDaoVoteAction(
    daoAddress: string,
    proposalId: string | number,
    support: boolean,
    reason: string = ''
): Promise<Action> {
    try {
        // Standard Governor interface selector for castVote
        const castVoteWithReasonSelector = '0x7b3c71d3';

        // Encode function parameters
        // Function: castVoteWithReason(uint256 proposalId, uint8 support, string reason)
        const proposalIdHex = Number(proposalId).toString(16).padStart(64, '0');
        const supportHex = (support ? 1 : 0).toString(16).padStart(64, '0');

        // Encode the reason string
        const reasonBytes = Buffer.from(reason, 'utf8');
        const reasonLength = reasonBytes.length.toString(16).padStart(64, '0');
        const reasonPadded = reasonBytes.toString('hex').padEnd(64 * Math.ceil(reasonBytes.length / 32), '0');

        // Combine all parameters
        const data = `${castVoteWithReasonSelector}${proposalIdHex}${supportHex}${reasonLength}${reasonPadded}`;

        // Prepare the action
        const action: Action = {
            target: daoAddress,      // DAO contract address
            value: '0',              // No ETH sent
            data: `0x${data}`,       // Calldata
            operation: 0,            // Standard call
            gasLimit: '300000',      // Gas limit
            nonce: Date.now().toString(), // Unique nonce
            deadline: (Math.floor(Date.now() / 1000) + 3600).toString(), // 1 hour from now
        };

        return action;
    } catch (error: any) {
        logger.error(`Error preparing DAO vote action:`, error);
        throw new Error(`Failed to prepare DAO vote action: ${error.message}`);
    }
}

/**
 * Prepare an action for token swapping
 */
export async function prepareTokenSwapAction(
    routerAddress: string,
    tokenInAddress: string,
    tokenOutAddress: string,
    amountIn: string,
    minAmountOut: string,
    recipient: string,
    deadline: number = Math.floor(Date.now() / 1000) + 1800 // 30 minutes from now
): Promise<Action> {
    try {
        // Uniswap V2 Router swapExactTokensForTokens selector
        const swapSelector = '0x38ed1739';

        // Encode function parameters
        // Function: swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] path, address to, uint deadline)
        const amountInHex = BigInt(amountIn).toString(16).padStart(64, '0');
        const minAmountOutHex = BigInt(minAmountOut).toString(16).padStart(64, '0');

        // Path array location (5 * 32 bytes from the start)
        const pathLocationHex = '00000000000000000000000000000000000000000000000000000000000000a0';

        // Recipient address
        const recipientHex = recipient.substring(2).padStart(64, '0');

        // Deadline
        const deadlineHex = deadline.toString(16).padStart(64, '0');

        // Path array length (2 tokens)
        const pathLengthHex = '0000000000000000000000000000000000000000000000000000000000000002';

        // Path array elements
        const token0Hex = tokenInAddress.substring(2).padStart(64, '0');
        const token1Hex = tokenOutAddress.substring(2).padStart(64, '0');

        // Combine all parameters
        const data = `${swapSelector}${amountInHex}${minAmountOutHex}${pathLocationHex}${recipientHex}${deadlineHex}${pathLengthHex}${token0Hex}${token1Hex}`;

        // Prepare the action
        const action: Action = {
            target: routerAddress,   // Router contract address
            value: '0',              // No ETH sent
            data: `0x${data}`,       // Calldata
            operation: 0,            // Standard call
            gasLimit: '250000',      // Gas limit
            nonce: Date.now().toString(), // Unique nonce
            deadline: deadline.toString(), // Deadline
        };

        return action;
    } catch (error: any) {
        logger.error(`Error preparing token swap action:`, error);
        throw new Error(`Failed to prepare token swap action: ${error.message}`);
    }
}

/**
 * Prepare an action for claiming rewards
 */
export async function prepareClaimRewardsAction(
    rewardContractAddress: string,
    claimFunction: string = 'getReward'
): Promise<Action> {
    try {
        // Get function selector
        const functionSignature = `${claimFunction}()`;
        const functionSelector = getFunctionSelector(functionSignature);

        // Prepare the action
        const action: Action = {
            target: rewardContractAddress, // Reward contract address
            value: '0',                   // No ETH sent
            data: functionSelector,       // Calldata
            operation: 0,                 // Standard call
            gasLimit: '200000',           // Gas limit
            nonce: Date.now().toString(), // Unique nonce
            deadline: (Math.floor(Date.now() / 1000) + 3600).toString(), // 1 hour from now
        };

        return action;
    } catch (error: any) {
        logger.error(`Error preparing claim rewards action:`, error);
        throw new Error(`Failed to prepare claim rewards action: ${error.message}`);
    }
}

/**
 * Prepare an action for depositing into a staking contract
 */
export async function prepareStakingDepositAction(
    stakingContractAddress: string,
    tokenAddress: string,
    amount: string,
    isEth: boolean = false
): Promise<Action> {
    try {
        let functionSelector;
        let data;
        let value = '0';

        if (isEth) {
            // For ETH staking (e.g., Lido), the function is often 'submit' or 'stake'
            functionSelector = getFunctionSelector('submit()');
            data = functionSelector;
            value = amount; // Send ETH with the transaction
        } else {
            // For ERC20 token staking, need to call deposit with amount
            functionSelector = getFunctionSelector('deposit(uint256)');
            const amountHex = BigInt(amount).toString(16).padStart(64, '0');
            data = `${functionSelector}${amountHex}`;
        }

        // Prepare the action
        const action: Action = {
            target: stakingContractAddress, // Staking contract address
            value,                        // ETH amount (0 for ERC20)
            data: data,                   // Calldata
            operation: 0,                 // Standard call
            gasLimit: '300000',           // Gas limit
            nonce: Date.now().toString(), // Unique nonce
            deadline: (Math.floor(Date.now() / 1000) + 3600).toString(), // 1 hour from now
        };

        return action;
    } catch (error: any) {
        logger.error(`Error preparing staking deposit action:`, error);
        throw new Error(`Failed to prepare staking deposit action: ${error.message}`);
    }
}

/**
 * Utility function to get the function selector
 */
function getFunctionSelector(signature: string): string {
    // In a real implementation, you would use ethers.js or web3.js to hash the function signature
    // For simplicity, we'll use hardcoded values for common functions

    const selectors = {
        'getReward()': '0x3d18b912',
        'claim()': '0x4e71d92d',
        'claimRewards()': '0x372500ab',
        'deposit(uint256)': '0xb6b55f25',
        'stake(uint256)': '0xa694fc3a',
        'submit()': '0x439370b1',
    };

    return selectors[signature] || '0x00000000'; // Fallback
}

/**
 * Get Gaia status
 */
export async function getGaiaStatus(): Promise<GaiaResponse> {
    try {
        const response = await gaiaClient.get('/status');

        return {
            success: true,
            data: response.data,
        };
    } catch (error: any) {
        logger.error(`Error getting Gaia status:`, error);

        return {
            success: false,
            error: error.response?.data?.message || error.message,
        };
    }
}