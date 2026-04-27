# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hardhat 3 beta project featuring a Solidity custodial wallet smart contract with deposit/withdraw, pause/unpause, reentrancy protection, and ownership control. Uses viem for Ethereum interactions and node:test for testing.

## Commands

```bash
# Install dependencies
pnpm install

# Compile contracts
pnpm run compile

# Run all tests
pnpm run test

# Run only Solidity tests
pnpx hardhat test solidity

# Run only node:test tests
pnpx hardhat test nodejs

# Start local Hardhat node
pnpm run node

# Deploy contracts via Ignition
pnpm run deploy

# Clean artifacts and cache (Hardhat + Foundry out/)
pnpm run clean

# Lint with oxlint
pnpm run lint

# Format code
pnpm run format

# Security analysis with Slither
pnpm slither

# Gas report (Foundry)
pnpm run gas-report

# Coverage report (Foundry)
pnpm run coverage
```

## Architecture

### Contract Inheritance Chain

```
ReentrancyGuard (abstract)
    ↓
Ownable (abstract) - inherits ReentrancyGuard
    ↓
Wallet (concrete) - inherits Ownable, Pausable
```

### Contract Files

- `contracts/Wallet.sol` - Main wallet with deposit/withdraw, pause/unpause
- `contracts/Ownable.sol` - Access control with owner, transferOwnership, renounceOwnership
- `contracts/Pausable.sol` - Pause/unpause functionality for emergency situations
- `contracts/ReentrancyGuard.sol` - NonReentrant modifier for reentrancy protection
- `contracts/Address.sol` - Library for safe ETH transfer (sendValue)

### Key Features

- Users can deposit ETH and track their balance
- Only owner can withdraw funds from any account
- Transaction history stored per account (deposits and withdrawals)
- Total balances tracking across all accounts
- Reentrancy protection on withdraw
- Pause/unpause functionality for emergency control
- Custom errors and events

### Test Files

- `test/Wallet.ts` - Comprehensive tests covering deposit, withdraw, receive, pause/unpause, balance queries, and Ownable functionality
- `contracts/Wallet.t.sol` - Foundry tests for Wallet contract (gas-optimized tests)

## Network Configuration

Hardhat config (`hardhat.config.ts`) includes:

- `hardhatMainnet` - Simulated L1 network
- `hardhatOp` - Simulated Optimism network
- `sepolia` - Requires SEPOLIA_RPC_URL and SEPOLIA_PRIVATE_KEY config variables

## Code Style

- Linting: oxlint (see `oxlint.config.ts`)
- Formatting: prettier with solidity plugin
- Solidity version: 0.8.28
- EVM target: cancun
- Testing: Hardhat (node:test) + Foundry (Wallet.t.sol)
