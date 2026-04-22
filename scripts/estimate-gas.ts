import { network } from 'hardhat'
import { formatEther, parseEther } from 'viem'

async function main() {
    const { viem } = await network.create({
        network: 'hardhatMainnet',
        chainType: 'l1',
    })

    const publicClient = await viem.getPublicClient()
    const [walletClient] = await viem.getWalletClients()

    console.log('\n=== Deploying Wallet Contract ===')
    const wallet = await viem.deployContract('Wallet')
    console.log('Wallet deployed at:', wallet.address)

    // Get current gas prices
    const feeData = await publicClient.getFeeHistory({
        blockCount: 1,
        rewardPercentiles: [50],
    })

    const baseFee = feeData.baseFeePerGas?.[0] ?? 0n
    const priorityFee = feeData.reward?.[0]?.[0] ?? 1000000n
    const maxFeePerGas = baseFee + priorityFee

    console.log('\n=== Gas Info ===')
    console.log('Base fee per gas:', baseFee.toString())
    console.log('Priority fee per gas:', priorityFee.toString())
    console.log('Max fee per gas:', maxFeePerGas.toString())

    // === DEPOSIT ===
    console.log('\n=== Estimating Gas for deposit() ===')
    const depositAmount = parseEther('1')

    const depositGas = await publicClient.estimateGas({
        account: walletClient.account.address,
        to: wallet.address,
        value: depositAmount,
    })

    const depositFee = depositGas * maxFeePerGas
    console.log('Estimated gas for deposit:', depositGas.toString())
    console.log('Estimated fee (deposit):', formatEther(depositFee), 'ETH')

    // Execute deposit
    await wallet.write.deposit({ value: depositAmount })
    console.log('Deposit executed successfully')

    // === WITHDRAW ===
    console.log('\n=== Estimating Gas for withdraw() ===')
    const withdrawAmount = parseEther('0.5')

    const withdrawGas = await wallet.estimateGas.withdraw(
        [walletClient.account.address, withdrawAmount],
        { account: walletClient.account.address },
    )

    const withdrawFee = withdrawGas * maxFeePerGas
    console.log('Estimated gas for withdraw:', withdrawGas.toString())
    console.log('Estimated fee (withdraw):', formatEther(withdrawFee), 'ETH')

    // === SUMMARY ===
    console.log('\n=== Summary ===')
    console.log('Deposit gas:', depositGas.toString())
    console.log('Withdraw gas:', withdrawGas.toString())
    console.log('Total gas:', (depositGas + withdrawGas).toString())
    console.log('Total fee:', formatEther(depositFee + withdrawFee), 'ETH')
}

await main()
