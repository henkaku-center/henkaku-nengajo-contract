import * as dotenv from 'dotenv'
import { writeFileSync } from 'fs'
import { ethers } from 'hardhat'

dotenv.config()

const main = async () => {
  const ForwarderFactory = await ethers.getContractFactory('Forwarder')
  const ForwarderContract = await ForwarderFactory.deploy()
  await ForwarderContract.deployed()

  const open_blockTimestamp: number = 1672542000
  const close_blockTimestamp: number = 1688180400
  const TicketFactory = await ethers.getContractFactory('PublicTicket')
  const TicketContract = await TicketFactory.deploy(
    'Henkaku Ticket 2023',
    'HNJ23',
    open_blockTimestamp,
    close_blockTimestamp,
    ForwarderContract.address
  )
  await TicketContract.deployed()

  await ForwarderContract.whitelistTarget(TicketContract.address, true)
  const x = TicketContract.interface.encodeFunctionData('mint', [1]).substring(0, 10)
  await ForwarderContract.whitelistMethod(TicketContract.address, x, true)

  console.log(`Forwarder: ${ForwarderContract.address}`)
  console.log(`Ticket  : ${TicketContract.address}`)

  writeFileSync(
    './scripts/public/deployed_contract_addr_polygon.json',
    JSON.stringify(
      {
        Fowarder: ForwarderContract.address,
        Ticket: TicketContract.address,
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
