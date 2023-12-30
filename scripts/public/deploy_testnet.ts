import * as dotenv from 'dotenv'
import { writeFileSync } from 'fs'
import { ethers } from 'hardhat'

dotenv.config()

const main = async () => {
  const ForwarderFactory = await ethers.getContractFactory('Forwarder')
  const ForwarderContract = await ForwarderFactory.deploy()
  await ForwarderContract.deployed()

  const open_blockTimestamp: number = 1671458400
  const close_blockTimestamp: number = 2671458400
  const OmamoriFactory = await ethers.getContractFactory('Omamori')
  const OmamoriContract = await OmamoriFactory.deploy(
    'Omamori',
    'OMM',
    open_blockTimestamp,
    close_blockTimestamp,
    ForwarderContract.address
  )
  await OmamoriContract.deployed()

  await ForwarderContract.whitelistTarget(OmamoriContract.address, true)
  const x = OmamoriContract.interface.encodeFunctionData('mint', [1]).substring(0, 10)
  await ForwarderContract.whitelistMethod(OmamoriContract.address, x, true)

  console.log(`Forwarder: ${ForwarderContract.address}`)
  console.log(`Omamori  : ${OmamoriContract.address}`)

  writeFileSync(
    './scripts/public/deployed_contract_addr_mumbai.json',
    JSON.stringify(
      {
        Fowarder: ForwarderContract.address,
        Omamori: OmamoriContract.address,
      },
      null,
      2
    )
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
