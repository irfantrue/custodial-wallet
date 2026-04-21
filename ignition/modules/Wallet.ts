import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'

export default buildModule('WalletModule', m => {
    const wallet = m.contract('Wallet')

    return { wallet }
})
