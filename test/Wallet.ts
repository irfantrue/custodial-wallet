import assert from 'node:assert'
import { describe, it } from 'node:test'

import { network } from 'hardhat'
import { getAddress, parseEther } from 'viem'

export interface Transaction {
    amount: bigint
    timestamp: bigint
}

export interface Account {
    balance: bigint
    depositCount: bigint
    withdrawCont: bigint
}

describe('Wallet', async () => {
    const { viem } = await network.create()
    const publicClient = await viem.getPublicClient()
    const [owner, alice, bob] = await viem.getWalletClients()

    describe('deposit()', () => {
        it('Should emit the Deposited event when calling deposit()', async () => {
            const wallet = await viem.deployContract('Wallet')
            const amount = parseEther('1')

            const txHash = wallet.write.deposit({ value: amount })
            const receipt = await publicClient.waitForTransactionReceipt({
                hash: await txHash,
            })
            const block = await publicClient.getBlock({
                blockNumber: receipt.blockNumber,
            })

            await viem.assertions.emitWithArgs(txHash, wallet, 'Deposited', [
                getAddress(owner.account.address),
                amount,
                0n,
                block.timestamp,
            ])
        })

        it('Should increase balance after deposit', async () => {
            const wallet = await viem.deployContract('Wallet')
            const amount = parseEther('1')

            await wallet.write.deposit({ value: amount })

            const balance = await wallet.read.balanceOf([owner.account.address])
            assert.strictEqual(balance, amount)
        })

        it('Should increase totalBalances after deposit', async () => {
            const wallet = await viem.deployContract('Wallet')
            const amount = parseEther('1')

            await wallet.write.deposit({ value: amount })

            const total = await wallet.read.totalBalances()
            assert.strictEqual(total, amount)
        })

        it('Should store deposit transaction correctly', async () => {
            const wallet = await viem.deployContract('Wallet')
            const amount = parseEther('1')

            const txHash = await wallet.write.deposit({ value: amount })
            const receipt = await publicClient.waitForTransactionReceipt({
                hash: txHash,
            })

            const block = await publicClient.getBlock({
                blockNumber: receipt.blockNumber,
            })
            const deposit = (await wallet.read.getDeposit([
                owner.account.address,
                0n,
            ])) as Transaction

            assert.strictEqual(deposit.amount, amount)
            assert.strictEqual(deposit.timestamp, block.timestamp)
        })

        it('Should revert with ZeroAmount when deposit amount is 0', async () => {
            const wallet = await viem.deployContract('Wallet')

            await assert.rejects(wallet.write.deposit({ value: 0n }), /ZeroAmount/)
        })

        it('Should accumulate multiple deposits correctly', async () => {
            const wallet = await viem.deployContract('Wallet')
            const amount1 = parseEther('1')
            const amount2 = parseEther('2')

            await wallet.write.deposit({ value: amount1 })
            await wallet.write.deposit({ value: amount2 })

            const balance = await wallet.read.balanceOf([owner.account.address])
            assert.strictEqual(balance, amount1 + amount2)
        })
    })

    describe('withdraw()', () => {
        it('Should emit the Withdraw event when calling withdraw()', async () => {
            const wallet = await viem.deployContract('Wallet')
            const amount = parseEther('1')

            await wallet.write.deposit({ value: amount })

            const txHash = wallet.write.withdraw([bob.account.address, amount])
            const receipt = await publicClient.waitForTransactionReceipt({
                hash: await txHash,
            })
            const block = await publicClient.getBlock({
                blockNumber: receipt.blockNumber,
            })

            await viem.assertions.emitWithArgs(txHash, wallet, 'Withdraw', [
                getAddress(owner.account.address),
                getAddress(bob.account.address),
                amount,
                0n,
                block.timestamp,
            ])
        })

        it('Should decrease balance after withdraw', async () => {
            const wallet = await viem.deployContract('Wallet')
            const depositAmount = parseEther('3')
            const withdrawAmount = parseEther('1')

            await wallet.write.deposit({ value: depositAmount })
            await wallet.write.withdraw([owner.account.address, withdrawAmount])

            const balance = await wallet.read.balanceOf([owner.account.address])
            assert.strictEqual(balance, depositAmount - withdrawAmount)
        })

        it('Should decrease totalBalances after withdraw', async () => {
            const wallet = await viem.deployContract('Wallet')
            const depositAmount = parseEther('5')
            const withdrawAmount = parseEther('2')

            await wallet.write.deposit({ value: depositAmount })
            await wallet.write.withdraw([owner.account.address, withdrawAmount])

            const total = await wallet.read.totalBalances()
            assert.strictEqual(total, depositAmount - withdrawAmount)
        })

        it('Should send ETH to the recipient', async () => {
            const wallet = await viem.deployContract('Wallet')
            const amount = parseEther('1')

            await wallet.write.deposit({ value: amount })

            const balanceBefore = await publicClient.getBalance({
                address: bob.account.address,
            })
            await wallet.write.withdraw([bob.account.address, amount])
            const balanceAfter = await publicClient.getBalance({
                address: bob.account.address,
            })

            assert.strictEqual(balanceAfter - balanceBefore, amount)
        })

        it('Should store withdrawal transaction correctly', async () => {
            const wallet = await viem.deployContract('Wallet')
            const amount = parseEther('1')

            await wallet.write.deposit({ value: amount })

            const txHash = wallet.write.withdraw([owner.account.address, amount])
            const receipt = await publicClient.waitForTransactionReceipt({
                hash: await txHash,
            })
            const block = await publicClient.getBlock({
                blockNumber: receipt.blockNumber,
            })

            const withdrawl = await wallet.read.getWithdrawal([owner.account.address, 0n])

            assert.strictEqual(withdrawl.amount, amount)
            assert.strictEqual(withdrawl.timestamp, block.timestamp)
        })

        it('Should revert with InsufficientBalance when amount exceeds balance', async () => {
            const wallet = await viem.deployContract('Wallet')
            const amount = parseEther('1')

            await wallet.write.deposit({ value: amount })

            await assert.rejects(
                wallet.write.withdraw([owner.account.address, parseEther('2')]),
                /InsufficientBalance/,
            )
        })

        it('Should revert with ZeroAmount when withdraw amount is 0', async () => {
            const wallet = await viem.deployContract('Wallet')
            const amount = parseEther('1')

            await wallet.write.deposit({ value: amount })

            await assert.rejects(wallet.write.withdraw([owner.account.address, 0n]), /ZeroAmount/)
        })

        it('Should revert with ZeroAddress when to is zero address', async () => {
            const wallet = await viem.deployContract('Wallet')
            const amount = parseEther('1')

            await wallet.write.deposit({ value: amount })

            await assert.rejects(
                wallet.write.withdraw(['0x0000000000000000000000000000000000000000', amount]),
                /ZeroAddress/,
            )
        })
    })

    describe('receive()', () => {
        it('Should handle plain ETH transfers via receive()', async () => {
            const wallet = await viem.deployContract('Wallet')
            const amount = parseEther('1')

            await owner.sendTransaction({
                to: wallet.address,
                value: amount,
            })

            const balance = await wallet.read.balanceOf([owner.account.address])
            assert.strictEqual(balance, amount)
        })
    })

    describe('balanceOf()', () => {
        it('Should revert with ZeroAddress when querying zero address', async () => {
            const wallet = await viem.deployContract('Wallet')

            await assert.rejects(
                wallet.read.balanceOf(['0x0000000000000000000000000000000000000000']),
                /ZeroAddress/,
            )
        })

        it('Should return 0 for an account with no deposits', async () => {
            const wallet = await viem.deployContract('Wallet')

            const balance = await wallet.read.balanceOf([alice.account.address])
            assert.strictEqual(balance, BigInt(0))
        })
    })
})
