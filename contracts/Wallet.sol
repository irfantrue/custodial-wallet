// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.28;

import { ReentrancyGuard } from "./ReentrancyGuard.sol";
import { Address } from "./Address.sol";

/// @title A title that should describe the contract/interface
/// @author The name of the author
/// @notice Explain to an end user what this does
/// @dev Explain to a developer any extra details
contract Wallet is ReentrancyGuard {
    using Address for address payable;

    struct Transaction {
        uint256 amount;
        uint256 timestamp;
    }

    struct Account {
        uint256 balance;
        uint256 depositCount;
        uint256 withdrawCount;
        mapping(uint256 => Transaction) deposits;
        mapping(uint256 => Transaction) withdrawals;
    }

    mapping(address => Account) private _accounts;

    uint256 private _totalBalances;

    event Deposited(
        address indexed account,
        uint256 indexed amount,
        uint256 index,
        uint256 timestamp
    );

    event Withdraw(
        address indexed account,
        address indexed to,
        uint256 indexed amount,
        uint256 index,
        uint256 timestamp
    );

    error ZeroAddress();
    error ZeroAmount();
    error InsufficientBalance();

    /// @notice Explain to an end user what this does
    /// @dev Explain to a developer any extra details
    /// @param account a parameter just like in doxygen (must be followed by parameter name)
    /// @return uint256 the return variables of a contract’s function state variable
    function balanceOf(address account) external view returns (uint256) {
        if (account == address(0)) revert ZeroAddress();
        return _accounts[account].balance;
    }

    function totalBalances() external view returns (uint256) {
        return _totalBalances;
    }

    function getDeposit(address account, uint256 index) external view returns (Transaction memory) {
        return _accounts[account].deposits[index];
    }

    function getWithdrawal(
        address account,
        uint256 index
    ) external view returns (Transaction memory) {
        return _accounts[account].withdrawals[index];
    }

    function deposit() external payable {
        _deposit(msg.sender, msg.value);
    }

    function withdraw(address payable to, uint256 amount) external nonReentrant {
        _withdraw(msg.sender, to, amount);
    }

    receive() external payable {
        _deposit(msg.sender, msg.value);
    }

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
