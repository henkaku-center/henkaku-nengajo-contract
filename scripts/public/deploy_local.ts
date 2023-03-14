import * as dotenv from 'dotenv'
import { setBalance } from '@nomicfoundation/hardhat-network-helpers'
import { ethers } from 'hardhat'
import { Contract } from 'ethers'

dotenv.config()

const main = async () => {
  const localUserAddresses = String(process.env.LOCAL_USERS_ADDRESSES).split(',')
  for (const address of localUserAddresses) {
    await setBalance(address, 100n ** 9n)
  }

  const ForwarderFactory = await ethers.getContractFactory('Forwarder')
  const ForwarderContract = await ForwarderFactory.deploy()
  await ForwarderContract.deployed()

  const open_blockTimestamp: number = 1671458400
  const close_blockTimestamp: number = 2671458400
  const TicketFactory = await ethers.getContractFactory('PublicTicket')
  const TicketContract = await TicketFactory.deploy(
    'Henkaku Ticket',
    'HNJ',
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
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
