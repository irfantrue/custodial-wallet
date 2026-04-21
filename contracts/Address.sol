// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.28;

/// @title A title that should describe the contract/interface
/// @author The name of the author
/// @notice Explain to an end user what this does
/// @dev Explain to a developer any extra details
library Address {
    error SendValueFailed();

    /// @notice Explain to an end user what this does
    /// @dev Explain to a developer any extra details
    /// @param recipient a parameter just like in doxygen (must be followed by parameter name)
    /// @param amount a parameter just like in doxygen (must be followed by parameter name)
    function sendValue(address payable recipient, uint256 amount) internal {
        (bool success, ) = recipient.call{ value: amount }("");
        if (!success) revert SendValueFailed();
    }
}
