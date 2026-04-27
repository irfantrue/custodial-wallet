// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Wallet } from "./Wallet.sol";

contract WalletGasTest {
    Wallet public wallet;

    function setUp() public {
        wallet = new Wallet();
    }

    receive() external payable {}

    function testDepositGas() external {
        wallet.deposit{ value: 1 ether }();
    }

    function testWithdrawGas() external {
        wallet.deposit{ value: 1 ether }();
        wallet.withdraw(payable(address(this)), 0.5 ether);
    }

    function testPauseGas() external {
        wallet.pause();
    }

    function testUnpauseGas() external {
        wallet.pause();
        wallet.unpause();
    }
}
