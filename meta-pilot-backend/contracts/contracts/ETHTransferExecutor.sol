// contracts/contracts/ETHTransferExecutor.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./DelegationRegistry.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title ETHTransferExecutor
 * @dev Executes ETH transfers on behalf of delegators using session keys
 */
contract ETHTransferExecutor is ReentrancyGuard {
    // The delegation registry contract
    DelegationRegistry public delegationRegistry;
    
    // Function selector for the executeTransfer function
    bytes4 public constant TRANSFER_SELECTOR = bytes4(keccak256("executeTransfer(address,address,uint256)"));
    
    // Events
    event TransferExecuted(
        address indexed delegator,
        address indexed sessionKey,
        address indexed recipient,
        uint256 amount
    );
    
    constructor(address _delegationRegistry) {
        delegationRegistry = DelegationRegistry(_delegationRegistry);
    }
    
    /**
     * @dev Execute an ETH transfer on behalf of a delegator
     * @param delegator The address of the delegator
     * @param recipient The address to send ETH to
     * @param amount The amount of ETH to send
     */
    function executeTransfer(
        address delegator,
        address recipient,
        uint256 amount
    ) external nonReentrant {
        // Verify caller is a valid session key
        require(
            delegationRegistry.isDelegationValid(delegator, msg.sender),
            "Invalid session key"
        );
        
        // Check permission
        require(
            delegationRegistry.hasPermission(delegator, msg.sender, TRANSFER_SELECTOR),
            "Session key does not have permission"
        );
        
        // Check if delegator has enough balance
        require(
            address(delegator).balance >= amount,
            "Insufficient balance"
        );
        
        // Execute the transfer
        payable(recipient).transfer(amount);
        
        // Emit event
        emit TransferExecuted(delegator, msg.sender, recipient, amount);
    }
    
    /**
     * @dev Allow delegators to deposit ETH to this contract
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