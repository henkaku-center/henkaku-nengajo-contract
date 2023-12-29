import * as dotenv from 'dotenv'
import { setBalance } from '@nomicfoundation/hardhat-network-helpers'
import { ethers, upgrades } from 'hardhat'
import { Nengajo } from '../../typechain-types'

dotenv.config()

const LOCAL_FORWARDER_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3'

const main = async () => {
  const localUserAddresses = String(process.env.LOCAL_USERS_ADDRESSES).split(',')
  for (const address of localUserAddresses) {
    await setBalance(address, 100n ** 9n)
  }

  const HenkakuV2Factory = await ethers.getContractFactory('HenkakuToken')
  const HenkakuV2Contract = await HenkakuV2Factory.deploy()
  await HenkakuV2Contract.waitForDeployment()

  await HenkakuV2Contract.addWhitelistUsers(localUserAddresses)
  for (const address of localUserAddresses) {
    await HenkakuV2Contract.mint(address, 100n ** 12n)
  }

  const open_blockTimestamp: number = 1671458400
  const close_blockTimestamp: number = 2671458400
  const NengajoFactory = (await ethers.getContractFactory('Nengajo'))
  const NengajoContract = (await upgrades.deployProxy(
    NengajoFactory,
    [
      'Henkaku Nengajo',
      'HNJ',
      open_blockTimestamp,
      close_blockTimestamp,
      await HenkakuV2Contract.getAddress(),
      localUserAddresses[0],
      LOCAL_FORWARDER_ADDRESS
    ],
    {
      kind: 'uups',
      initializer: 'initialize'
    }
  )) as unknown as Nengajo
  await NengajoContract.waitForDeployment()

  console.log(`HenkakuV2: ${await HenkakuV2Contract.getAddress()}`)
  console.log(`Nengajo  : ${await NengajoContract.getAddress()}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
