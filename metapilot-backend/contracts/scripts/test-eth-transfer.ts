// contracts/scripts/test-eth-transfer.ts
import { ethers } from "hardhat";

async function main() {
  // Get contract addresses from .env or use hardcoded deployment addresses
  const DELEGATION_REGISTRY_ADDRESS = process.env.DELEGATION_REGISTRY_ADDRESS!;
  const ETH_TRANSFER_EXECUTOR_ADDRESS = process.env.ETH_TRANSFER_EXECUTOR_ADDRESS!;
  
  // Create test wallet for session key
  const sessionKey = ethers.Wallet.createRandom().connect(ethers.provider);
  console.log("Session Key Address:", sessionKey.address);
  console.log("Session Key Private Key:", sessionKey.privateKey);
  
  // Get signers
  const [delegator] = await ethers.getSigners();
  
  // Get contract instances
  const delegationRegistry = await ethers.getContractAt("DelegationRegistry", DELEGATION_REGISTRY_ADDRESS);
  const ethTransferExecutor = await ethers.getContractAt("ETHTransferExecutor", ETH_TRANSFER_EXECUTOR_ADDRESS);
  
  // Fund session key with some ETH for gas
  console.log("Funding session key with ETH for gas...");
  await delegator.sendTransaction({
    to: sessionKey.address,
    value: ethers.parseEther("0.01"),
  });
  console.log("Session key funded with 0.01 ETH");
  
  // Fund the ETH transfer executor contract
  console.log("Funding ETH transfer executor contract...");
  await delegator.sendTransaction({
    to: ETH_TRANSFER_EXECUTOR_ADDRESS,
    value: ethers.parseEther("0.1"),
  });
  console.log("Contract funded with 0.1 ETH");
  
  // Create a delegation for the session key
  console.log("Creating delegation for session key...");
  
  // Function selector for executeTransfer
  const transferSelector = ethers.id("executeTransfer(address,address,uint256)").slice(0, 10);
  
  // Create permissions array
  const permissions = [
    ethers.zeroPadBytes(transferSelector, 32), // Pad to 32 bytes for bytes32
  ];
  
  // Set expiration to 1 day from now
  const expiresAt = Math.floor(Date.now() / 1000) + 86400;
  
  // Create delegation
  await delegationRegistry.createDelegation(
    sessionKey.address,
    permissions,
    expiresAt
  );
  
  console.log("Delegation created successfully");
  
  // Create a recipient address for the transfer
  const recipient = ethers.Wallet.createRandom().address;
  console.log("Recipient Address:", recipient);
  
  // Execute a transfer using the session key
  console.log("Executing transfer with session key...");
  
  // Connect the session key to the contract
  const sessionKeyWallet = new ethers.Wallet(sessionKey.privateKey, ethers.provider);
  const executorWithSessionKey = ethTransferExecutor.connect(sessionKeyWallet);
  
  // Execute the transfer
  const tx = await executorWithSessionKey.executeTransfer(
    delegator.address,
    recipient,
    ethers.parseEther("0.05") // Transfer 0.05 ETH
  );
  
  await tx.wait();
  console.log("Transfer executed successfully");
  console.log("Transaction Hash:", tx.hash);
  
  // Check recipient balance
  const recipientBalance = await ethers.provider.getBalance(recipient);
  console.log("Recipient Balance:", ethers.formatEther(recipientBalance), "ETH");
  
  console.log("Test completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });