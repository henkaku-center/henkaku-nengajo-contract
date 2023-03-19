import * as dotenv from 'dotenv'
import { setBalance } from '@nomicfoundation/hardhat-network-helpers'
import { ethers } from 'hardhat'

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

  const open_blockTimestamp: number = 1671458400
  const close_blockTimestamp: number = 2671458400
  const TicketFactory = await ethers.getContractFactory('Ticket')
  const TicketContract = await TicketFactory.deploy(
    'Henkaku Ticket',
    'HNJ',
    open_blockTimestamp,
    close_blockTimestamp,
    HenkakuV2Contract.address,
    localUserAddresses[0]
  )
  await TicketContract.deployed()

  console.log(`HenkakuV2: ${HenkakuV2Contract.address}`)
  console.log(`Ticket  : ${TicketContract.address}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
