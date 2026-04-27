// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.28;

import { Ownable } from "./Ownable.sol";
import { Pausable } from "./Pausable.sol";
import { Address } from "./Address.sol";

/// @title Wallet
/// @notice A simple wallet contract with deposit and withdraw functionality
/// @author Irfan Nurul Susilo
/// @dev Inherits from Ownable for access control and reentrancy protection
/// @dev Users can deposit ETH and track their balance
/// @dev Only the owner can withdraw funds from any account
contract Wallet is Ownable, Pausable {
    using Address for address payable;

    /// @notice Represents a single transaction record
    struct Transaction {
        uint256 amount;
        uint256 timestamp;
    }

    /// @notice Represents a user's account with balance and transaction history
    struct Account {
        uint256 balance;
        uint256 depositCount;
        uint256 withdrawCount;
        mapping(uint256 => Transaction) deposits;
        mapping(uint256 => Transaction) withdrawals;
    }

    /// @notice Maps user addresses to their account data
    mapping(address => Account) private _accounts;

    /// @notice Tracks the total balance of all accounts in the contract
    uint256 private _totalBalances;

    /// @notice Emitted when a user deposits ETH
    /// @param account The address that deposited
    /// @param amount The amount deposited in wei
    /// @param index The deposit index for this account
    /// @param timestamp The block timestamp
    event Deposited(
        address indexed account,
        uint256 indexed amount,
        uint256 index,
        uint256 timestamp
    );

    /// @notice Emitted when the owner withdraws ETH
    /// @param account The account from which ETH was withdrawn
    /// @param to The recipient address
    /// @param amount The amount withdrawn in wei
    /// @param index The withdrawal index for this account
    /// @param timestamp The block timestamp
    event Withdraw(
        address indexed account,
        address indexed to,
        uint256 indexed amount,
        uint256 index,
        uint256 timestamp
    );

    /// @notice Thrown when the amount is zero
    error ZeroAmount();
    /// @notice Thrown when the account has insufficient balance
    error InsufficientBalance();

    /// @notice Returns the balance of a specific account
    /// @param account The address to query the balance for
    /// @return The account balance in wei
    /// @dev Reverts if account is zero address
    function balanceOf(address account) external view returns (uint256) {
        if (account == address(0)) revert ZeroAddress();
        return _accounts[account].balance;
    }

    /// @notice Returns the total balance of all accounts
    /// @return The total balance in wei
    function totalBalances() external view returns (uint256) {
        return _totalBalances;
    }

    /// @notice Returns a specific deposit transaction for an account
    /// @param account The account address
    /// @param index The deposit index
    /// @return The Transaction struct with amount and timestamp
    function getDeposit(address account, uint256 index) external view returns (Transaction memory) {
        return _accounts[account].deposits[index];
    }

    /// @notice Returns a specific withdrawal transaction for an account
    /// @param account The account address
    /// @param index The withdrawal index
    /// @return The Transaction struct with amount and timestamp
    function getWithdrawal(
        address account,
        uint256 index
    ) external view returns (Transaction memory) {
        return _accounts[account].withdrawals[index];
    }

    /// @notice Deposits ETH into the caller's account
    /// @dev Stores the deposit and emits a Deposited event
    /// @dev Reverts if amount is zero
    function deposit() external payable whenNotPaused {
        _deposit(msg.sender, msg.value);
    }

    /// @notice Withdraws ETH from an account to a specified address
    /// @dev Can only be called by the owner
    /// @dev Uses nonReentrant modifier to prevent reentrancy attacks
    /// @param to The address to receive the withdrawn ETH
    /// @param amount The amount to withdraw in wei
    function withdraw(
        address payable to,
        uint256 amount
    ) external onlyOwner nonReentrant whenNotPaused {
        _withdraw(msg.sender, to, amount);
    }

    /// @notice Fallback function to receive plain ETH transfers
    /// @dev Automatically deposits ETH sent directly to the contract
    receive() external payable whenNotPaused {
        _deposit(msg.sender, msg.value);
    }

    /// @notice Pauses the contract, preventing all deposits and withdrawals
    /// @dev Can only be called by the owner
    /// @dev All functions using whenNotPaused modifier will revert
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Unpauses the contract, allowing deposits and withdrawals to resume
    /// @dev Can only be called by the owner
    function unpause() external onlyOwner {
        _unpause();
    }

    /// @dev Internal function to handle deposits
    /// @param account The account to deposit to
    /// @param amount The amount to deposit
    /// @dev Reverts if account is zero address or amount is zero
    function _deposit(address account, uint256 amount) internal {
        if (account == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();

        Account storage acc = _accounts[account];

        acc.balance += amount;
        _totalBalances += amount;

        uint256 index = acc.depositCount;

        acc.deposits[index] = Transaction(amount, block.timestamp);
        ++acc.depositCount;

        emit Deposited(account, amount, index, block.timestamp);
    }

    /// @dev Internal function to handle withdrawals
    /// @param account The account to withdraw from
    /// @param to The recipient address
    /// @param amount The amount to withdraw
    /// @dev Reverts if either address is zero, amount is zero, or insufficient balance
    function _withdraw(address account, address payable to, uint256 amount) internal {
        if (account == address(0) || to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();

        Account storage acc = _accounts[account];

        if (acc.balance < amount) revert InsufficientBalance();

        acc.balance -= amount;
        _totalBalances -= amount;

        uint256 index = acc.withdrawCount;

        acc.withdrawals[index] = Transaction(amount, block.timestamp);
        ++acc.withdrawCount;

        to.sendValue(amount);

        emit Withdraw(account, to, amount, index, block.timestamp);
    }
}
