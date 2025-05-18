// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@metamask/delegation-framework/contracts/DelegationManager.sol";
import "@metamask/delegation-framework/contracts/caveat-enforcers/AllowedTargetsEnforcer.sol";
import "@metamask/delegation-framework/contracts/caveat-enforcers/ValueLteEnforcer.sol";

/**
 * @title ETHTransferExecutor
 * @dev Executes ETH transfers on behalf of delegators using MetaMask DTK
 */
contract ETHTransferExecutor is ReentrancyGuard {
    // The delegation manager contract
    DelegationManager public delegationManager;
    
    // Caveat enforcers for limiting transfer permissions
    AllowedTargetsEnforcer public allowedTargetsEnforcer;
    ValueLteEnforcer public valueLteEnforcer;
    
    // Events
    event TransferExecuted(
        address indexed delegator,
        address indexed sessionKey,
        address indexed recipient,
        uint256 amount
    );
    
    constructor(address _delegationManager) {
        delegationManager = DelegationManager(_delegationManager);
        
        // Deploy caveat enforcers
        allowedTargetsEnforcer = new AllowedTargetsEnforcer();
        valueLteEnforcer = new ValueLteEnforcer();
    }
    
    /**
     * @dev Receive function to accept ETH
     */
    receive() external payable {}
    
    /**
     * @dev Allow delegators to withdraw their ETH
     */
    function withdraw() external {
        uint256 balance = address(this).balance;
        require(balance > 0, "No ETH to withdraw");
        
        payable(msg.sender).transfer(balance);
    }
}