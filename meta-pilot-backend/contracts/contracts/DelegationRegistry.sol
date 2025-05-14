// contracts/contracts/DelegationRegistry.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/**
 * @title DelegationRegistry
 * @dev Implementation of the ERC-7715 delegation standard
 * This allows session keys to act on behalf of delegators
 */
contract DelegationRegistry {
    // Struct to define delegations
    struct Delegation {
        address delegator;
        address sessionKey;
        bytes32[] permissions; // Function selectors the delegate can access
        uint256 expiresAt;
        bool revoked;
    }
    
    // Mapping from delegator to session key to delegation
    mapping(address => mapping(address => Delegation)) public delegations;
    
    // Events
    event DelegationCreated(
        address indexed delegator,
        address indexed sessionKey,
        bytes32[] permissions,
        uint256 expiresAt
    );
    
    event DelegationRevoked(
        address indexed delegator,
        address indexed sessionKey
    );
    
    /**
     * @dev Create a new delegation for a session key
     * @param sessionKey The address of the session key
     * @param permissions The function selectors the session key can access
     * @param expiresAt The timestamp when the delegation expires
     */
    function createDelegation(
        address sessionKey,
        bytes32[] calldata permissions,
        uint256 expiresAt
    ) external {
        require(sessionKey != address(0), "Invalid session key");
        require(expiresAt > block.timestamp, "Expiration in the past");
        
        delegations[msg.sender][sessionKey] = Delegation({
            delegator: msg.sender,
            sessionKey: sessionKey,
            permissions: permissions,
            expiresAt: expiresAt,
            revoked: false
        });
        
        emit DelegationCreated(msg.sender, sessionKey, permissions, expiresAt);
    }
    
    /**
     * @dev Revoke a delegation
     * @param sessionKey The address of the session key to revoke
     */
    function revokeDelegation(address sessionKey) external {
        require(delegations[msg.sender][sessionKey].sessionKey == sessionKey, "Delegation not found");
        require(!delegations[msg.sender][sessionKey].revoked, "Already revoked");
        
        delegations[msg.sender][sessionKey].revoked = true;
        
        emit DelegationRevoked(msg.sender, sessionKey);
    }
    
    /**
     * @dev Check if a session key has permission to call a function
     * @param delegator The address of the delegator
     * @param sessionKey The address of the session key
     * @param functionSelector The function selector to check permission for
     */
    function hasPermission(
        address delegator,
        address sessionKey,
        bytes4 functionSelector
    ) external view returns (bool) {
        Delegation storage delegation = delegations[delegator][sessionKey];
        
        // Check if delegation exists, is not revoked, and has not expired
        if (delegation.sessionKey != sessionKey || 
            delegation.revoked ||
            delegation.expiresAt <= block.timestamp) {
            return false;
        }
        
        // Convert function selector to bytes32 for comparison
        // Fix: Properly convert bytes4 to bytes32
        bytes32 selector = bytes32(bytes.concat(functionSelector));
        
        // Check if the function selector is in the permissions array
        for (uint256 i = 0; i < delegation.permissions.length; i++) {
            if (delegation.permissions[i] == selector) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * @dev Get all permissions for a delegation
     */
    function getDelegationPermissions(
        address delegator,
        address sessionKey
    ) external view returns (bytes32[] memory) {
        return delegations[delegator][sessionKey].permissions;
    }
    
    /**
     * @dev Check if a delegation is valid
     */
    function isDelegationValid(
        address delegator,
        address sessionKey
    ) external view returns (bool) {
        Delegation storage delegation = delegations[delegator][sessionKey];
        
        return delegation.sessionKey == sessionKey && 
               !delegation.revoked &&
               delegation.expiresAt > block.timestamp;
    }
}