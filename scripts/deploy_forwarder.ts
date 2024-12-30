import * as dotenv from 'dotenv'
import { ethers } from 'hardhat'

dotenv.config()

const main = async () => {
  const ForwarderFactory = await ethers.getContractFactory('Forwarder')
  const ForwarderContract = await ForwarderFactory.deploy()
  await ForwarderContract.waitForDeployment()

  console.log(`Forwarder: ${await ForwarderContract.getAddress()}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
