import * as dotenv from 'dotenv'
import { ethers, upgrades } from 'hardhat'
import { Nengajo } from '../../typechain-types'

dotenv.config()

const main = async () => {
  const testnetUserAddresses = String(process.env.TESTNET_USERS_ADDRESSES).split(',')

  // const HenkakuV2Factory = await ethers.getContractFactory('HenkakuToken')
  // const HenkakuV2Contract = await HenkakuV2Factory.deploy()
  // await HenkakuV2Contract.deployed()

  // await HenkakuV2Contract.addWhitelistUsers(testnetUserAddresses)
  // for (const address of testnetUserAddresses) {
  //   await HenkakuV2Contract.mint(address, ethers.utils.parseEther('1000'))
  // }

  // testnetのHenkakuV2のコントラクトアドレスを指定
  const HenkakuV2ContractAddress = '0x095F411f6759Fa8C088327399293eCc9a0E35fbb'
  const ForwarderContractAddress = '0x55Cd62CC87a4C7f97D0CE9FF00F7a90E9aa12882'

  const open_blockTimestamp: number = 0
  const close_blockTimestamp: number = 2671458400
  const NengajoFactory = await ethers.getContractFactory('Nengajo')
  const NengajoContract = (await upgrades.deployProxy(
    NengajoFactory,
    [
      'Henkaku Nengajo',
      'HNJ',
      open_blockTimestamp,
      close_blockTimestamp,
      HenkakuV2ContractAddress,
      testnetUserAddresses[0],
      ForwarderContractAddress
    ],
    {
      kind: 'uups',
      initializer: 'initialize'
    }
  )) as unknown as Nengajo

  await NengajoContract.waitForDeployment()

  const NengajoContractAddress = await NengajoContract.getAddress()
  
  let NengajoImplementationAddress: string
  try {
    NengajoImplementationAddress = await upgrades.erc1967.getImplementationAddress(NengajoContractAddress)
  } catch (error) {
    NengajoImplementationAddress =''
    console.error(error)
  }

  console.log(`HenkakuV2: ${HenkakuV2ContractAddress}`)
  console.log(`Nengajo implementation: ${NengajoImplementationAddress}`)
  console.log(`Nengajo proxy: ${NengajoContractAddress}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
