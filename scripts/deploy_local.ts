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
    await HenkakuV2Contract.mint(address, 100)
  }

  const open_blockTimestamp: number = 0
  const close_blockTimestamp: number = 1000000000
  const NengajoFactory = await ethers.getContractFactory('Nengajo')
  const NengajoContract = await NengajoFactory.deploy(
    'Henkaku Nengajo',
    'HNJ',
    open_blockTimestamp,
    close_blockTimestamp,
    HenkakuV2Contract.address,
    localUserAddresses[0]
  )
  await NengajoContract.deployed()

  console.log(`HenkakuV2: ${HenkakuV2Contract.address}`)
  console.log(`Nengajo  : ${NengajoContract.address}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
