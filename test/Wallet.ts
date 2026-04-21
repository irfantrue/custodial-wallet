import { describe, expect, it } from 'bun:test'

import { network } from 'hardhat'
import { Transaction } from 'types/index.js'
import { getAddress, parseEther } from 'viem'

describe('Wallet', async function () {
    const { viem } = await network.create()
    const publicClient = await viem.getPublicClient()
    const [owner, alice, bob] = await viem.getWalletClients()

    describe('deposit()', function () {
        it('Should emit the Deposited event when calling deposit()', async function () {
            const wallet = await viem.deployContract('Wallet')
            const amount = parseEther('1')

            await viem.assertions.emitWithArgs(
                wallet.write.deposit([], { value: amount }),
                wallet,
                'Deposited',
                [getAddress(owner.account.address), amount],
            )
        })

        it('Should increase balance after deposit', async function () {
            const wallet = await viem.deployContract('Wallet')
            const amount = parseEther('1')

            await wallet.write.deposit([], { value: amount })

            const balance = await wallet.read.balanceOf([owner.account.address])
            expect(balance).toBe(amount)
        })

        it('Should increase totalBalances after deposit', async function () {
            const wallet = await viem.deployContract('Wallet')
            const amount = parseEther('1')

            await wallet.write.deposit([], { value: amount })

            const total = await wallet.read.totalBalances()
            expect(total).toBe(amount)
        })

        it('Should store deposit transaction correctly', async function () {
            const wallet = await viem.deployContract('Wallet')
            const amount = parseEther('1')

            const txHash = await wallet.write.deposit([], { value: amount })
            const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })

            const block = await publicClient.getBlock({ blockNumber: receipt.blockNumber })
            const deposit = (await wallet.read.getDeposit([
                owner.account.address,
                0n,
            ])) as Transaction

            expect(deposit.amount).toBe(amount)
            expect(deposit.timestamp).toBe(block.timestamp)
        })

        it('Should revert with ZeroAmount when deposit amount is 0', async function () {
            const wallet = await viem.deployContract('Wallet')

            expect(wallet.write.deposit([], { value: 0n })).rejects.toThrow('ZeroAmount')
        })

        it('Should accumulate multiple deposits correctly', async function () {
            const wallet = await viem.deployContract('Wallet')
            const amount1 = parseEther('1')
            const amount2 = parseEther('2')

            await wallet.write.deposit([], { value: amount1 })
            await wallet.write.deposit([], { value: amount2 })

            const balance = await wallet.read.balanceOf([owner.account.address])
            expect(balance).toBe(amount1 + amount2)
        })
    })

    describe('withdraw()', function () {
        it('Should emit the Withdraw event when calling withdraw()', async function () {
            const wallet = await viem.deployContract('Wallet')
            const amount = parseEther('1')

            await wallet.write.deposit([], { value: amount })

            await viem.assertions.emitWithArgs(
                wallet.write.withdraw([bob.account.address, amount]),
                wallet,
                'Withdraw',
                [getAddress(owner.account.address), getAddress(bob.account.address), amount],
            )
        })

        it('Should decrease balance after withdraw', async function () {
            const wallet = await viem.deployContract('Wallet')
            const depositAmount = parseEther('3')
            const withdrawAmount = parseEther('1')

            await wallet.write.deposit([], { value: depositAmount })
            await wallet.write.withdraw([owner.account.address, withdrawAmount])

            const balance = await wallet.read.balanceOf([owner.account.address])
            expect(balance).toBe(depositAmount - withdrawAmount)
        })
    })

    describe('balanceOf()', function () {
        it('Should revert with ZeroAddress when querying zero address', async function () {
            const wallet = await viem.deployContract('Wallet')

            expect(
                wallet.read.balanceOf(['0x0000000000000000000000000000000000000000']),
            ).rejects.toThrow('ZeroAddress')
        })

        it('Should return 0 for an account with no deposits', async function () {
            const wallet = await viem.deployContract('Wallet')

            const balance = await wallet.read.balanceOf([alice.account.address])
            expect(balance).toBe(0)
        })
    })
})
