import * as dotenv from 'dotenv'
import { setBalance } from '@nomicfoundation/hardhat-network-helpers'
import { writeFileSync } from 'fs'
import { ethers } from 'hardhat'

dotenv.config()

const main = async () => {
  const localUserAddresses = String(process.env.LOCAL_USERS_ADDRESSES).split(',')
  for (const address of localUserAddresses) {
    await setBalance(address, 100n ** 9n)
  }

  const ForwarderFactory = await ethers.getContractFactory('Forwarder')
  const ForwarderContract = await ForwarderFactory.deploy()
  await ForwarderContract.deployed()

  const HenkakuV2Factory = await ethers.getContractFactory('HenkakuToken')
  const HenkakuV2Contract = await HenkakuV2Factory.deploy()
  await HenkakuV2Contract.deployed()

  await HenkakuV2Contract.addWhitelistUsers(localUserAddresses)
  for (const address of localUserAddresses) {
    await HenkakuV2Contract.mint(address, 100n ** 12n)
  }

  const open_blockTimestamp: number = 1671458400
  const close_blockTimestamp: number = 2671458400

  const NengajoFactory = await ethers.getContractFactory('Nengajo')
  const NengajoContract = await NengajoFactory.deploy(
    'HENKAKU Nengajo 2024',
    'HNJ2024',
    open_blockTimestamp,
    close_blockTimestamp,
    HenkakuV2Contract.address!,
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // local address #0
    ForwarderContract.address!
  )
  await NengajoContract.deployed()

  const OmamoriFactory = await ethers.getContractFactory('Omamori')
  const OmamoriContract = await OmamoriFactory.deploy(
    'Omamori 2024',
    'OMM24',
    open_blockTimestamp,
    close_blockTimestamp,
    ForwarderContract.address
  )
  await OmamoriContract.deployed()

  await ForwarderContract.whitelistTarget(NengajoContract.address, true)
  const x = NengajoContract.interface.encodeFunctionData('mint', [1]).substring(0, 10)
  await ForwarderContract.whitelistMethod(NengajoContract.address, x, true)

  await ForwarderContract.whitelistTarget(OmamoriContract.address, true)
  const y = OmamoriContract.interface.encodeFunctionData('mint', [1]).substring(0, 10)
  await ForwarderContract.whitelistMethod(OmamoriContract.address, y, true)

  console.log(`Forwarder: ${ForwarderContract.address}`)
  console.log(`HenkakuV2: ${HenkakuV2Contract.address}`)
  console.log(`NengajoContractAddress: ${NengajoContract.address}`)
  console.log(`Omamori  : ${OmamoriContract.address}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
