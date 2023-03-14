import * as dotenv from 'dotenv'
import { ethers } from 'hardhat'

dotenv.config()

const main = async () => {
  const open_blockTimestamp: number = 1672542000
  const close_blockTimestamp: number = 1675220400
  const TicketFactory = await ethers.getContractFactory('Ticket')
  const TicketContract = await TicketFactory.deploy(
    'HENKAKU Ticket',
    'HNJ',
    open_blockTimestamp,
    close_blockTimestamp,
    process.env.HENKAKU_V2_ADDRESS!,
    process.env.POOL_WALLET_ADDRESS!
  )
  await TicketContract.deployed()

  console.log(`TicketContractAddress: ${TicketContract.address}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
