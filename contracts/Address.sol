// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.28;

/// @title Safe address library for ETH transfers
/// @notice Provides utility functions for sending Ether safely
/// @dev Uses low-level call to transfer ETH, reverts on failure
library Address {
    error SendValueFailed();

    /// @notice Sends Ether to a recipient address
    /// @dev Reverts if the transfer fails
    /// @param recipient The address to send ETH to
    /// @param amount The amount of ETH to send in wei
    function sendValue(address payable recipient, uint256 amount) internal {
        (bool success, ) = recipient.call{ value: amount }("");
        if (!success) revert SendValueFailed();
    }
}
