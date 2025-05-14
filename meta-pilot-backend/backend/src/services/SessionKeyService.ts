// backend/src/services/SessionKeyService.ts
import { ethers } from 'ethers';
import User from '../models/User';
import { logger } from '../utils/logger';
import * as crypto from 'crypto';

// Interfaces for MetaMask DTK
interface Permission {
  target: string;              // Contract address
  functionSelectors: string[]; // Function selectors (e.g., "executeTransfer(address,address,uint256)")
  tokenIds?: number[];         // For ERC-721/ERC-1155 if applicable
}

interface DelegationRequest {
  delegatorAddress: string;    // User's wallet address
  sessionKeyAddress: string;   // Generated session key address
  permissions: Permission[];   // Array of permissions
  expiryTimestamp: number;     // When the delegation expires (unix timestamp)
}

// Define the type for a delegation from the database
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
  /**
   * Encrypts a private key for storage
   * In production, use a proper KMS or HSM solution
   */
  private encryptPrivateKey(privateKey: string): string {
    // Check if we have a secure encryption key
    const secretKey = process.env.SESSION_KEY_ENCRYPTION_KEY;
    if (!secretKey) {
      logger.warn('SESSION_KEY_ENCRYPTION_KEY not set. Using default insecure key - DO NOT USE IN PRODUCTION!');
    }
    
    // This is a simple encryption for development
    // IMPORTANT: Use a proper key management system in production
    const algorithm = 'aes-256-ctr';
    const key = secretKey || 'dev-encryption-key-change-in-production';
    
    // Generate initialization vector
    const iv = crypto.randomBytes(16);
    
    try {
      // Create cipher and encrypt
      const cipher = crypto.createCipheriv(algorithm, key.slice(0, 32), iv);
      const encrypted = Buffer.concat([cipher.update(privateKey), cipher.final()]);
      
      return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
    } catch (error: any) {
      logger.error('Error encrypting private key:', error);
      throw new Error('Failed to encrypt session key');
    }
  }
  
  /**
   * Decrypts a stored private key
   */
  private decryptPrivateKey(encryptedKey: string): string {
    // Check if we have a secure encryption key
    const secretKey = process.env.SESSION_KEY_ENCRYPTION_KEY;
    if (!secretKey) {
      logger.warn('SESSION_KEY_ENCRYPTION_KEY not set. Using default insecure key - DO NOT USE IN PRODUCTION!');
    }
    
    const algorithm = 'aes-256-ctr';
    const key = secretKey || 'dev-encryption-key-change-in-production';
    
    try {
      const [ivHex, encryptedHex] = encryptedKey.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      const encryptedText = Buffer.from(encryptedHex, 'hex');
      
      const decipher = crypto.createDecipheriv(algorithm, key.slice(0, 32), iv);
      const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
      
      return decrypted.toString();
    } catch (error: any) {
      logger.error('Error decrypting private key:', error);
      throw new Error('Failed to decrypt session key');
    }
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
   * Saves a delegation in the database for ETH transfers on Sepolia
   */
  async saveDelegation(delegationRequest: DelegationRequest, storePrivateKey: boolean = false, privateKey?: string): Promise<boolean> {
    try {
      const { delegatorAddress, sessionKeyAddress, permissions, expiryTimestamp } = delegationRequest;
      
      // Find or create user
      let user = await User.findOne({ address: delegatorAddress.toLowerCase() });
      if (!user) {
        user = await User.create({
          address: delegatorAddress.toLowerCase(),
          preferences: {
            network: 'sepolia', // Always Sepolia for MVP
          }
        });
      }
      
      // Validate that this delegation is for the ETH Transfer Executor contract
      const executorAddress = process.env.ETH_TRANSFER_EXECUTOR_ADDRESS?.toLowerCase();
      if (executorAddress) {
        const hasExecutorPermission = permissions.some(
          p => p.target.toLowerCase() === executorAddress
        );
        
        if (!hasExecutorPermission) {
          logger.warn(`Delegation for ${sessionKeyAddress} does not include ETH Transfer Executor permission`);
        }
      }
      
      // Convert permissions to our DB format
      const dbPermissions = permissions.map(perm => ({
        contractAddress: perm.target.toLowerCase(),
        functionSelectors: perm.functionSelectors,
        tokenIds: perm.tokenIds || [],
      }));
      
      // Add delegation to user
      const delegation = {
        sessionKeyAddress: sessionKeyAddress,
        createdAt: new Date(),
        expiresAt: new Date(expiryTimestamp * 1000), // Convert to milliseconds
        permissions: dbPermissions,
        status: 'active',
      } as Delegation;
      
      // If we're storing the private key (for managed keys)
      if (storePrivateKey && privateKey) {
        delegation.privateKey = this.encryptPrivateKey(privateKey);
      }
      
      // Check for existing delegation with this session key and update it
      const existingIndex = user.delegations.findIndex(
        d => d.sessionKeyAddress === sessionKeyAddress
      );
      
      if (existingIndex >= 0) {
        user.delegations[existingIndex] = delegation;
      } else {
        user.delegations.push(delegation);
      }
      
      await user.save();
      
      logger.info(`Saved ETH transfer delegation for user ${delegatorAddress}, session key: ${sessionKeyAddress}`);
      return true;
    } catch (error: any) {
      logger.error('Error saving delegation:', error);
      return false;
    }
  }
  
  /**
   * Gets a session key by its address
   */
  async getSessionKey(sessionKeyAddress: string): Promise<Delegation | null> {
    try {
      // Find user with this session key
      const user = await User.findOne(
        { 'delegations.sessionKeyAddress': sessionKeyAddress },
        { 'delegations.$': 1 } // Only return the matching delegation
      ).select('+delegations.privateKey'); // Include private key in results
      
      if (!user || !user.delegations.length) return null;
      
      const delegation = user.delegations[0] as Delegation;
      
      // If expired, update status
      if (delegation.expiresAt < new Date() && delegation.status === 'active') {
        await User.updateOne(
          { 'delegations.sessionKeyAddress': sessionKeyAddress },
          { $set: { 'delegations.$.status': 'expired' } }
        );
        delegation.status = 'expired';
      }
      
      // If private key exists, decrypt it
      if (delegation.privateKey) {
        try {
          delegation.privateKey = this.decryptPrivateKey(delegation.privateKey);
        } catch (decryptError) {
          logger.error(`Failed to decrypt private key for session ${sessionKeyAddress}:`, decryptError);
          delegation.privateKey = undefined; // Set to undefined instead of null
        }
      }
      
      return delegation;
    } catch (error: any) {
      logger.error('Error getting session key:', error);
      return null;
    }
  }
  
  /**
   * Checks if a session key has permission to execute ETH transfers
   */
  async hasPermission(
    sessionKeyAddress: string, 
    contractAddress: string, 
    functionSelector: string
  ): Promise<boolean> {
    try {
      // Find user with this session key
      const user = await User.findOne({
        'delegations.sessionKeyAddress': sessionKeyAddress,
        'delegations.status': 'active',
        'delegations.expiresAt': { $gt: new Date() }, // Not expired
      });
      
      if (!user) {
        logger.warn(`No active user found for session key ${sessionKeyAddress}`);
        return false;
      }
      
      // Find the delegation
      const delegation = user.delegations.find(
        d => d.sessionKeyAddress === sessionKeyAddress
      );
      
      if (!delegation) {
        logger.warn(`No active delegation found for session key ${sessionKeyAddress}`);
        return false;
      }
      
      // Check if the delegation has the required permission
      const hasPermission = delegation.permissions.some(
        p => p.contractAddress.toLowerCase() === contractAddress.toLowerCase() &&
             p.functionSelectors.includes(functionSelector)
      );
      
      if (!hasPermission) {
        logger.warn(`Session key ${sessionKeyAddress} does not have permission for ${functionSelector} on ${contractAddress}`);
      }
      
      return hasPermission;
    } catch (error: any) {
      logger.error('Error checking permission:', error);
      return false;
    }
  }
  
  /**
   * Gets all active delegations for a user
   */
  async getUserDelegations(userAddress: string): Promise<Delegation[]> {
    try {
      const user = await User.findOne({ address: userAddress.toLowerCase() });
      if (!user) return [];
      
      // Update expired delegations
      const now = new Date();
      for (const delegation of user.delegations) {
        if (delegation.status === 'active' && delegation.expiresAt < now) {
          delegation.status = 'expired';
        }
      }
      
      // Save if we updated any
      if (user.isModified()) {
        await user.save();
      }
      
      // Filter to only active delegations
      return user.delegations.filter(d => d.status === 'active') as Delegation[];
    } catch (error: any) {
      logger.error('Error getting user delegations:', error);
      return [];
    }
  }
  
  /**
   * Revokes a delegation
   */
  async revokeDelegation(userAddress: string, sessionKeyAddress: string): Promise<boolean> {
    try {
      const user = await User.findOne({ address: userAddress.toLowerCase() });
      if (!user) return false;
      
      // Find and update the delegation
      const delegationIndex = user.delegations.findIndex(
        d => d.sessionKeyAddress === sessionKeyAddress
      );
      
      if (delegationIndex === -1) return false;
      
      user.delegations[delegationIndex].status = 'revoked';
      await user.save();
      
      logger.info(`Revoked ETH transfer delegation for user ${userAddress}, session key: ${sessionKeyAddress}`);
      return true;
    } catch (error: any) {
      logger.error('Error revoking delegation:', error);
      return false;
    }
  }
}

export default new SessionKeyService();