// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.28;

/// @title Pausable
/// @notice Provides the ability to pause and unpause the contract
/// @dev Inheriting contracts must implement _pause() and _unpause()
abstract contract Pausable {
    /// @notice Tracks whether the contract is paused
    bool private _paused;

    /// @notice Emitted when the pause state changes
    /// @param isPaused True if paused, false if unpaused
    event PausedSet(bool isPaused);

    /// @notice Thrown when an operation is attempted while the contract is paused
    error Paused();

    /// @notice Prevents execution if the contract is paused
    modifier whenNotPaused() {
        if (_paused) revert Paused();
        _;
    }

    /// @notice Returns true if the contract is paused
    function isPaused() external view returns (bool) {
        return _paused;
    }

    /// @dev Internal function to pause the contract
    function _pause() internal virtual {
        _paused = true;
        emit PausedSet(true);
    }

    /// @dev Internal function to unpause the contract
    function _unpause() internal virtual {
        _paused = false;
        emit PausedSet(false);
    }
}
