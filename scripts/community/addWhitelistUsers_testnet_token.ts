import * as dotenv from 'dotenv'
import { ethers } from 'hardhat'

dotenv.config()

const main = async () => {
  const testnetUserAddresses = String(process.env.TESTNET_USERS_ADDRESSES).split(',')

  const HenkakuV2Factory = await ethers.getContractFactory('HenkakuToken')
  const HenkakuV2Contract = await HenkakuV2Factory.attach('0x095F411f6759Fa8C088327399293eCc9a0E35fbb')

  await HenkakuV2Contract.addWhitelistUsers(testnetUserAddresses)
  for (const address of testnetUserAddresses) {
    await HenkakuV2Contract.mint(address, ethers.parseEther('1000'))
  }

  console.log(`HenkakuV2: ${await HenkakuV2Contract.getAddress()}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
