// backend/src/scripts/seedData.ts
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { logger } from '../utils/logger';
import User from '../models/User';
import Task from '../models/Task';
import { createETHTransferTask } from '../models/taskTypes/ETHTransferTask';
import { ethers } from 'ethers';

dotenv.config();

// Test wallet for development
const TEST_WALLET_ADDRESS = '0xc77274ADE0e5C20dE7FcB2001dC6ff1E11418342';
const TEST_SESSION_KEY = ethers.Wallet.createRandom();

// Connect to database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/metapilot')
  .then(async () => {
    logger.info('MongoDB connected...');
    
    try {
      // Clear existing data
      await User.deleteMany({});
      await Task.deleteMany({});
      
      // Get ETH transfer executor address from env var or use a default for testing
      const ETH_TRANSFER_EXECUTOR_ADDRESS = process.env.ETH_TRANSFER_EXECUTOR_ADDRESS || 
        '0x4Fb202140c5319106F15706b1A69E441c9536306'; // Example address, replace with actual address
      
      // Create test user with delegation
      const user = await User.create({
        address: TEST_WALLET_ADDRESS.toLowerCase(),
        preferences: {
          notificationEmail: 'test@example.com',
          notificationsEnabled: true,
          defaultGasPreference: 'medium',
          network: 'sepolia',
        },
        delegations: [{
          sessionKeyAddress: TEST_SESSION_KEY.address,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          permissions: [{
            contractAddress: ETH_TRANSFER_EXECUTOR_ADDRESS.toLowerCase(),
            functionSelectors: ['executeTransfer(address,address,uint256)'],
          }],
          status: 'active',
        }],
      });
      
      logger.info(`Created test user with address ${TEST_WALLET_ADDRESS}`);
      logger.info(`Created test session key ${TEST_SESSION_KEY.address}`);
      logger.info(`Private key (save this): ${TEST_SESSION_KEY.privateKey}`);
      
      // Create ETH transfer task based on ETH price
      const ethPriceTask = createETHTransferTask({
        userId: user._id,
        name: 'Send ETH when price drops',
        description: 'Automatically send ETH to recipient when price drops 5%',
        sessionKeyId: TEST_SESSION_KEY.address,
        status: 'active',
        network: 'sepolia',
        configuration: {
          recipientAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', // Example recipient
          amount: ethers.parseEther('0.01').toString(), // 0.01 ETH
          transferRule: 'Send 0.01 ETH to my friend when ETH price drops 5%'
        },
        conditions: {
          conditionType: 'price_threshold',
          priceCondition: {
            type: 'below',
            priceThreshold: '300000000000', // $3000.00 with 8 decimals
            referencePrice: '315000000000', // $3150.00 with 8 decimals (5% higher)
          }
        },
      });
      
      await Task.create(ethPriceTask);
      logger.info('Created ETH price-based transfer task');
      
      // Create ETH transfer task based on gas price
      const gasPriceTask = createETHTransferTask({
        userId: user._id,
        name: 'Send ETH when gas is cheap',
        description: 'Automatically send ETH when gas price is low',
        sessionKeyId: TEST_SESSION_KEY.address,
        status: 'active',
        network: 'sepolia',
        configuration: {
          recipientAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // Self-transfer for testing
          amount: ethers.parseEther('0.005').toString(), // 0.005 ETH
        },
        conditions: {
          conditionType: 'gas_price',
          gasPriceCondition: {
            type: 'below',
            gasPriceThreshold: '20000000000', // 20 gwei
          }
        },
      });
      
      await Task.create(gasPriceTask);
      logger.info('Created gas price-based ETH transfer task');
      
      // Create ETH transfer task based on balance threshold
      const balanceTask = createETHTransferTask({
        userId: user._id,
        name: 'Send ETH when balance is high',
        description: 'Automatically send ETH when wallet balance exceeds threshold',
        sessionKeyId: TEST_SESSION_KEY.address,
        status: 'active',
        network: 'sepolia',
        configuration: {
          recipientAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', // Example recipient
          amount: ethers.parseEther('0.1').toString(), // 0.1 ETH
        },
        conditions: {
          conditionType: 'balance_threshold',
          balanceCondition: {
            type: 'above',
            balanceThreshold: ethers.parseEther('1').toString(), // 1 ETH
          }
        },
      });
      
      await Task.create(balanceTask);
      logger.info('Created balance-based ETH transfer task');
      
      logger.info('Sample data seeded successfully');
      process.exit(0);
    } catch (error) {
      logger.error('Error seeding data:', error);
      process.exit(1);
    }
  });