import * as dotenv from 'dotenv'
import { ethers } from 'hardhat'
import { Ticket__factory } from '../../typechain-types'

dotenv.config()

const main = async () => {
  const localUserAddresses = String(process.env.TESTNET_USERS_ADDRESSES).split(',')

  const HenkakuV2Factory = await ethers.getContractFactory('HenkakuToken')
  const HenkakuV2Contract = await HenkakuV2Factory.deploy()
  await HenkakuV2Contract.deployed()

  await HenkakuV2Contract.addWhitelistUsers(localUserAddresses)
  for (const address of localUserAddresses) {
    await HenkakuV2Contract.mint(address, ethers.utils.parseEther('1000'))
  }

  const TicketFactory = (await ethers.getContractFactory('Ticket')) as Ticket__factory
  const TicketContract = await TicketFactory.deploy('Henkaku Ticket', 'HT', HenkakuV2Contract.address)
  await TicketContract.deployed()

  console.log(`HenkakuV2: ${HenkakuV2Contract.address}`)
  console.log(`Ticket  : ${TicketContract.address}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
