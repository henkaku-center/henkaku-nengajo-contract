import * as dotenv from 'dotenv'
import { writeFileSync } from 'fs'
import { ethers } from 'hardhat'

dotenv.config()

const main = async () => {
  const ForwarderFactory = await ethers.getContractFactory('Forwarder')
  const ForwarderContract = await ForwarderFactory.deploy()
  await ForwarderContract.deployed()

  const open_blockTimestamp: number = 1704078000
  const close_blockTimestamp: number = 1706756400
  const NengajoFactory = await ethers.getContractFactory('Omamori')
  const NengajoContract = await NengajoFactory.deploy(
    'Omamori 2024',
    'OMM24',
    open_blockTimestamp,
    close_blockTimestamp,
    ForwarderContract.address
  )
  await NengajoContract.deployed()

  await ForwarderContract.whitelistTarget(NengajoContract.address, true)
  const x = NengajoContract.interface.encodeFunctionData('mint', [1]).substring(0, 10)
  await ForwarderContract.whitelistMethod(NengajoContract.address, x, true)

  console.log(`Forwarder: ${ForwarderContract.address}`)
  console.log(`Nengajo  : ${NengajoContract.address}`)

  writeFileSync(
    './scripts/public/deployed_contract_addr_polygon.json',
    JSON.stringify(
      {
        Fowarder: ForwarderContract.address,
        Nengajo: NengajoContract.address,
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
