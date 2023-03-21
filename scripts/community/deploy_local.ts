import * as dotenv from 'dotenv'
import { setBalance } from '@nomicfoundation/hardhat-network-helpers'
import { ethers } from 'hardhat'
import { Ticket__factory } from '../../typechain-types'

dotenv.config()

const main = async () => {
  const localUserAddresses = String(process.env.LOCAL_USERS_ADDRESSES).split(',')
  for (const address of localUserAddresses) {
    await setBalance(address, 100n ** 9n)
  }

  const HenkakuV2Factory = await ethers.getContractFactory('HenkakuToken')
  const HenkakuV2Contract = await HenkakuV2Factory.deploy()
  await HenkakuV2Contract.deployed()

  await HenkakuV2Contract.addWhitelistUsers(localUserAddresses)
  for (const address of localUserAddresses) {
    await HenkakuV2Contract.mint(address, 100n ** 12n)
  }

  const TicketFactory = (await ethers.getContractFactory('Ticket')) as Ticket__factory
  const TicketContract = await TicketFactory.deploy('Henkaku Ticket', 'HNJ', HenkakuV2Contract.address)
  await TicketContract.deployed()
  const tx = await TicketContract.switchMintable()
  await tx.wait()

  console.log(`HenkakuV2: ${HenkakuV2Contract.address}`)
  console.log(`Ticket  : ${TicketContract.address}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
