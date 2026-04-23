// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.28;

/// @title ReentrancyGuard
/// @notice Provides protection against reentrancy attacks
/// @dev Uses a mutex pattern to prevent recursive function calls
abstract contract ReentrancyGuard {
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    uint256 private _status;

    error Reentrancy();

    /// @notice Prevents a contract from calling itself, directly or indirectly
    /// @dev Setting status to ENTERED before function execution and NOT_ENTERED after
    modifier nonReentrant() {
        if (_status == _ENTERED) revert Reentrancy();
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }

    /// @dev Initializes the reentrancy guard to the not entered state
    constructor() {
        _status = _NOT_ENTERED;
    }
}
