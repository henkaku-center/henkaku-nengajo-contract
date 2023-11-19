import * as dotenv from 'dotenv'
import { ethers } from 'hardhat'

dotenv.config()

const main = async () => {
  const testnetUserAddresses = String(process.env.TESTNET_USERS_ADDRESSES).split(',')

  const HenkakuV2Factory = await ethers.getContractFactory('HenkakuToken')
  const HenkakuV2Contract = await HenkakuV2Factory.deploy()
  await HenkakuV2Contract.deployed()

  await HenkakuV2Contract.addWhitelistUsers(testnetUserAddresses)
  for (const address of testnetUserAddresses) {
    await HenkakuV2Contract.mint(address, ethers.utils.parseEther('1000'))
  }

  console.log(`HenkakuV2: ${HenkakuV2Contract.address}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
