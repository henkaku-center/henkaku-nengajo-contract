import * as dotenv from 'dotenv'
import { ethers } from 'hardhat'

dotenv.config()

const main = async () => {
  const TicketFactory = await ethers.getContractFactory('Ticket')
  const TicketContract = await TicketFactory.deploy(
    'HENKAKU Ticket',
    'HNJ',
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
