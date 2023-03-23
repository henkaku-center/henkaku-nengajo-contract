import * as dotenv from 'dotenv'
import { ethers } from 'hardhat'
import { Ticket__factory } from '../../typechain-types'

dotenv.config()

const main = async () => {
  const TicketFactory = (await ethers.getContractFactory('Ticket')) as Ticket__factory
  const TicketContract = await TicketFactory.deploy('HENKAKU Ticket', 'HT', process.env.HENKAKU_V2_ADDRESS!)
  console.log(TicketContract)
  await TicketContract.deployed()

  console.log(`TicketContractAddress: ${TicketContract.address}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
