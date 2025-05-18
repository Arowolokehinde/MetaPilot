// contracts/scripts/deploy-dtk.ts
import { ethers } from "hardhat";

async function main() {
  // Get the deployment account
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying DTK contracts with account:", deployer.address);
  
  // Deploy the EntryPoint contract (or use an existing one)
  const entryPointAddress = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"; // Standard entry point
  
  // Deploy the DelegatorSetup contract
  const DelegatorSetup = await ethers.getContractFactory("DelegatorSetup");
  const delegatorSetup = await DelegatorSetup.deploy(entryPointAddress);
  await delegatorSetup.deployed();
  
  console.log("DelegatorSetup deployed to:", delegatorSetup.address);
  
  // Get the addresses of the deployed components
  const delegationManagerAddress = await delegatorSetup.getDelegationManager();
  const hybridDelegatorImplementationAddress = await delegatorSetup.getHybridDelegatorImplementation();
  
  console.log("DelegationManager deployed to:", delegationManagerAddress);
  console.log("HybridDeleGator implementation deployed to:", hybridDelegatorImplementationAddress);
  
  // Deploy the ETHTransferExecutor contract
  const ETHTransferExecutor = await ethers.getContractFactory("ETHTransferExecutor");
  const ethTransferExecutor = await ETHTransferExecutor.deploy(delegationManagerAddress);
  await ethTransferExecutor.deployed();
  
  console.log("ETHTransferExecutor deployed to:", ethTransferExecutor.address);
  
  // Deploy the caveat enforcers if needed directly
  const allowedTargetsEnforcerAddress = await ethTransferExecutor.allowedTargetsEnforcer();
  const valueLteEnforcerAddress = await ethTransferExecutor.valueLteEnforcer();
  
  console.log("AllowedTargetsEnforcer deployed to:", allowedTargetsEnforcerAddress);
  console.log("ValueLteEnforcer deployed to:", valueLteEnforcerAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });