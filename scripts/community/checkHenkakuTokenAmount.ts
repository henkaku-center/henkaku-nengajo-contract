import * as dotenv from 'dotenv'
import { ethers } from 'hardhat'

dotenv.config()

const main = async () => {
  const localUserAddresses = String(process.env.LOCAL_USERS_ADDRESSES).split(',')

  const HenkakuV2Factory = await ethers.getContractFactory('HenkakuToken')
  const HenkakuV2Contract = await HenkakuV2Factory.attach("0x5FbDB2315678afecb367f032d93F642f64180aa3")


  console.log(`HenkakuV2: ${HenkakuV2Contract.address}`)
  for (const address of localUserAddresses) {
    console.log(`${address}: ${await HenkakuV2Contract.balanceOf(address)}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
