// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.28;

import { ReentrancyGuard } from "./ReentrancyGuard.sol";

/// @title Ownable
/// @notice Provides basic access control with an owner
/// @dev Inherits from ReentrancyGuard for flexibility in derived contracts
abstract contract Ownable is ReentrancyGuard {
    address private _owner;

    /// @notice Emitted when ownership is transferred
    /// @param previousOwner The previous owner address
    /// @param newOwner The new owner address
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /// @notice Thrown when caller is not the owner
    error Unauthorized();
    /// @notice Thrown when address is zero
    error ZeroAddress();

    /// @dev Throws if called by any account other than the owner
    modifier onlyOwner() {
        if (msg.sender != _owner) revert Unauthorized();
        _;
    }

    /// @dev Initializes the contract setting the deployer as the initial owner
    constructor() {
        _owner = msg.sender;
    }

    /// @notice Returns the address of the current owner
    /// @return The owner address
    function owner() external view returns (address) {
        return _owner;
    }

    /// @notice Returns true if the caller is the owner
    /// @return True if caller is owner, false otherwise
    function _isOwner() internal view returns (bool) {
        return msg.sender == _owner;
    }

    /// @notice Transfers ownership of the contract to a new account
    /// @dev Can only be called by the current owner
    /// @param newOwner The address of the new owner
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        address previousOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(previousOwner, newOwner);
    }

    /// @notice Renounces ownership of the contract, setting owner to zero address
    /// @dev Can only be called by the current owner
    function renounceOwnership() external onlyOwner {
        address previousOwner = _owner;
        _owner = address(0);
        emit OwnershipTransferred(previousOwner, address(0));
    }
}
