// backend/src/services/SessionKeyService.ts
import { ethers } from 'ethers';
import { logger } from '../utils/logger';
import User from '../models/User';
import { 
  createDelegation, 
  createCaveat,
  DelegatorSmartAccount,
  Implementation,
  toMetaMaskSmartAccount
} from '@metamask/delegation-toolkit';

// Define the Delegation interface
interface Delegation {
  sessionKeyAddress: string;
  createdAt: Date;
  expiresAt: Date;
  permissions: {
    contractAddress: string;
    functionSelectors: string[];
    tokenIds: number[];
  }[];
  status: 'active' | 'expired' | 'revoked';
  privateKey?: string;
}

class SessionKeyService {
  private provider: ethers.providers.JsonRpcProvider;
  
  constructor() {
    const sepoliaRpcUrl = process.env.SEPOLIA_RPC_URL;
    
    if (!sepoliaRpcUrl) {
      throw new Error('SEPOLIA_RPC_URL environment variable is not set');
    }
    
    this.provider = new ethers.providers.JsonRpcProvider(sepoliaRpcUrl);
  }
  
  /**
   * Creates a new session key for a user
   */
  async createSessionKey(userAddress: string): Promise<{publicKey: string, privateKey: string}> {
    try {
      // Generate a new random account (session key)
      const sessionKey = ethers.Wallet.createRandom();
      
      logger.info(`Created new session key for ETH transfers on Sepolia - User: ${userAddress}, Key: ${sessionKey.address}`);
      
      return {
        publicKey: sessionKey.address,
        privateKey: sessionKey.privateKey
      };
    } catch (error: any) {
      logger.error(`Error creating session key for user ${userAddress}:`, error);
      throw new Error('Failed to create session key');
    }
  }
  
  /**
   * Creates a delegator smart account for a user
   */
  async createDelegatorAccount(userAddress: string): Promise<string> {
    try {
      // Create a new delegator account using the MetaMask DTK
      const account = new ethers.Wallet(process.env.PRIVATE_KEY!, this.provider);
      
      const delegatorAccount = await toMetaMaskSmartAccount({
        client: this.provider,
        implementation: Implementation.Hybrid,
        deployParams: [account.address, [], [], []],
        deploySalt: ethers.utils.hexZeroPad(ethers.utils.hexlify(ethers.utils.randomBytes(32)), 32),
        signatory: { account }
      });
      
      return delegatorAccount.address;
    } catch (error: any) {
      logger.error(`Error creating delegator account for user ${userAddress}:`, error);
      throw new Error('Failed to create delegator account');
    }
  }
  
  /**
   * Creates a delegation for ETH transfers
   */
  async createETHTransferDelegation(
    delegatorAddress: string,
    sessionKeyAddress: string,
    maxAmount: string,
    recipientAddress: string,
    expiryTimestamp: number
  ): Promise<any> {
    try {
      // Create a delegation with caveats
      const delegation = createDelegation({
        from: delegatorAddress,
        to: sessionKeyAddress,
        caveats: [
          // Add value limit caveat
          createCaveat({
            enforcer: process.env.VALUE_LTE_ENFORCER_ADDRESS!,
            terms: ethers.utils.defaultAbiCoder.encode(
              ['uint256'],
              [ethers.utils.parseEther(maxAmount)]
            )
          }),
          // Add allowed target caveat
          createCaveat({
            enforcer: process.env.ALLOWED_TARGETS_ENFORCER_ADDRESS!,
            terms: ethers.utils.defaultAbiCoder.encode(
              ['address[]'],
              [[recipientAddress]]
            )
          })
        ]
      });
      
      return delegation;
    } catch (error: any) {
      logger.error('Error creating ETH transfer delegation:', error);
      throw new Error('Failed to create delegation');
    }
  }
}

export default new SessionKeyService();