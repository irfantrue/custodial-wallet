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

            const withdrawal = await wallet.read.getWithdrawal([owner.account.address, 0n])

            assert.strictEqual(withdrawal.amount, amount)
            assert.strictEqual(withdrawal.timestamp, block.timestamp)
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

    describe('Ownable', async () => {
        it('Should set deployer as initial owner', async () => {
            const wallet = await viem.deployContract('Wallet')
            const ownerAddress = await wallet.read.owner()
            assert.strictEqual(ownerAddress, getAddress(owner.account.address))
        })

        it('Should emit OwnershipTransferred when transferring ownership', async () => {
            const wallet = await viem.deployContract('Wallet')

            const txHash = wallet.write.transferOwnership([alice.account.address])
            await publicClient.waitForTransactionReceipt({
                hash: await txHash,
            })

            await viem.assertions.emitWithArgs(txHash, wallet, 'OwnershipTransferred', [
                getAddress(owner.account.address),
                getAddress(alice.account.address),
            ])
        })

        it('Should transfer ownership to new owner', async () => {
            const wallet = await viem.deployContract('Wallet')

            await wallet.write.transferOwnership([alice.account.address])

            const newOwner = await wallet.read.owner()
            assert.strictEqual(newOwner, getAddress(alice.account.address))
        })

        it('Should revert Unauthorized when non-owner transfers ownership', async () => {
            const wallet = await viem.deployContract('Wallet')

            await assert.rejects(
                wallet.write.transferOwnership([bob.account.address], {
                    account: alice.account,
                }),
                /Unauthorized/,
            )
        })

        it('Should revert ZeroAddress when transferring to zero address', async () => {
            const wallet = await viem.deployContract('Wallet')

            await assert.rejects(
                wallet.write.transferOwnership(['0x0000000000000000000000000000000000000000']),
                /ZeroAddress/,
            )
        })

        it('Should emit OwnershipTransferred when renouncing ownership', async () => {
            const wallet = await viem.deployContract('Wallet')

            const txHash = wallet.write.renounceOwnership()
            await publicClient.waitForTransactionReceipt({
                hash: await txHash,
            })

            await viem.assertions.emitWithArgs(txHash, wallet, 'OwnershipTransferred', [
                getAddress(owner.account.address),
                '0x0000000000000000000000000000000000000000',
            ])
        })

        it('Should set owner to zero address after renouncing ownership', async () => {
            const wallet = await viem.deployContract('Wallet')

            await wallet.write.renounceOwnership()

            const currentOwner = await wallet.read.owner()
            assert.strictEqual(currentOwner, '0x0000000000000000000000000000000000000000')
        })

        it('Should revert Unauthorized when non-owner renounces ownership', async () => {
            const wallet = await viem.deployContract('Wallet')

            await assert.rejects(
                wallet.write.renounceOwnership({ account: alice.account }),
                /Unauthorized/,
            )
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

    describe('Pausable', () => {
        it('Should set initial state as not paused', async () => {
            const wallet = await viem.deployContract('Wallet')

            const isPaused = await wallet.read.isPaused()
            assert.strictEqual(isPaused, false)
        })

        it('Should allow deposit when not paused', async () => {
            const wallet = await viem.deployContract('Wallet')
            const amount = parseEther('1')

            await wallet.write.deposit({ value: amount })

            const balance = await wallet.read.balanceOf([owner.account.address])
            assert.strictEqual(balance, amount)
        })

        it('Should allow withdraw when not paused', async () => {
            const wallet = await viem.deployContract('Wallet')
            const depositAmount = parseEther('2')
            const withdrawAmount = parseEther('1')

            await wallet.write.deposit({ value: depositAmount })
            await wallet.write.withdraw([bob.account.address, withdrawAmount])

            const balance = await wallet.read.balanceOf([owner.account.address])
            assert.strictEqual(balance, depositAmount - withdrawAmount)
        })

        it('Should revert with Paused when deposit while paused', async () => {
            const wallet = await viem.deployContract('Wallet')
            const depositAmount = parseEther('1')

            await wallet.write.pause()

            await assert.rejects(wallet.write.deposit({ value: depositAmount }), /Paused/)
        })

        it('Should revert with Paused when withdraw while paused', async () => {
            const wallet = await viem.deployContract('Wallet')
            const amount = parseEther('1')

            await wallet.write.deposit({ value: amount })
            await wallet.write.pause()

            await assert.rejects(wallet.write.withdraw([bob.account.address, amount]), /Paused/)
        })

        it('Should revert with Paused when receive ETH while paused', async () => {
            const wallet = await viem.deployContract('Wallet')
            const amount = parseEther('1')

            await wallet.write.pause()

            await assert.rejects(
                owner.sendTransaction({
                    to: wallet.address,
                    value: amount,
                }),
                /Paused/,
            )
        })

        it('Should allow deposit after unpause', async () => {
            const wallet = await viem.deployContract('Wallet')

            await wallet.write.pause()
            await wallet.write.unpause()

            await wallet.write.deposit({ value: parseEther('1') })

            const balance = await wallet.read.balanceOf([owner.account.address])
            assert.strictEqual(balance, parseEther('1'))
        })

        it('Should allow withdraw after unpause', async () => {
            const wallet = await viem.deployContract('Wallet')

            await wallet.write.deposit({ value: parseEther('2') })
            await wallet.write.pause()
            await wallet.write.unpause()
            await wallet.write.withdraw([bob.account.address, parseEther('1')])

            const balance = await wallet.read.balanceOf([owner.account.address])
            assert.strictEqual(balance, parseEther('1'))
        })

        it('Should revert Unauthorized when non-owner calls pause', async () => {
            const wallet = await viem.deployContract('Wallet')

            await assert.rejects(wallet.write.pause({ account: alice.account }), /Unauthorized/)
        })

        it('Should revert Unauthorized when non-owner calls unpause', async () => {
            const wallet = await viem.deployContract('Wallet')

            await wallet.write.pause()

            await assert.rejects(wallet.write.unpause({ account: alice.account }), /Unauthorized/)
        })
    })
})
