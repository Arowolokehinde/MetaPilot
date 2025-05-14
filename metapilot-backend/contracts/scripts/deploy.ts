// contracts/scripts/deploy.ts
import { ethers } from "hardhat";

async function main() {
  console.log("Starting deployment...");

  // Deploy delegation registry
  console.log("Deploying DelegationRegistry...");
  const DelegationRegistry = await ethers.getContractFactory("DelegationRegistry");
  const delegationRegistry = await DelegationRegistry.deploy();
  await delegationRegistry.deploymentTransaction().wait();
  console.log("DelegationRegistry deployed to:", delegationRegistry.target);
  
  // Deploy ETH transfer executor
  console.log("Deploying ETHTransferExecutor...");
  const ETHTransferExecutor = await ethers.getContractFactory("ETHTransferExecutor");
  const ethTransferExecutor = await ETHTransferExecutor.deploy(delegationRegistry.target);
  await ethTransferExecutor.deploymentTransaction().wait();
  console.log("ETHTransferExecutor deployed to:", ethTransferExecutor.target);
  
  // Deploy test DAO
  console.log("Deploying TestDAO...");
  const TestDAO = await ethers.getContractFactory("TestDAO");
  const testDAO = await TestDAO.deploy();
  await testDAO.deploymentTransaction().wait();
  console.log("TestDAO deployed to:", testDAO.target);
  
  // Create test proposal in DAO
  console.log("Creating test proposal in DAO...");
  await testDAO.createTestProposal(
    "Reward Distribution Proposal",
    "This proposal suggests distributing 0.1 ETH as rewards to active community members. The rewards will be allocated based on participation metrics from the last quarter.",
    100 // 100 blocks voting period
  );
  console.log("Test proposal created successfully");
  
  // Create another test proposal with keywords for AI testing
  await testDAO.createTestProposal(
    "Community Development Fund Allocation",
    "This proposal recommends allocating 0.2 ETH from the treasury to fund community-led initiatives and events. The funds will be used to promote adoption and education about our project.",
    100 // 100 blocks voting period
  );
  console.log("Second test proposal created successfully");
  
  console.log("Deployment completed successfully!");
  
  // Print summary of deployed contracts
  console.log("\nDeployed Contracts Summary:");
  console.log("============================");
  console.log(`DelegationRegistry: ${delegationRegistry.target}`);
  console.log(`ETHTransferExecutor: ${ethTransferExecutor.target}`);
  console.log(`TestDAO: ${testDAO.target}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });