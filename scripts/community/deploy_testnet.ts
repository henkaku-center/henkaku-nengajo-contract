import * as dotenv from 'dotenv'
import { ethers } from 'hardhat'

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

  const open_blockTimestamp: number = 0
  const close_blockTimestamp: number = 2671458400
  const NengajoFactory = await ethers.getContractFactory('Nengajo')
  const NengajoContract = await NengajoFactory.deploy(
    'Henkaku Nengajo',
    'HNJ',
    open_blockTimestamp,
    close_blockTimestamp,
    HenkakuV2ContractAddress,
    testnetUserAddresses[0]
  )
  await NengajoContract.deployed()

  console.log(`HenkakuV2: ${HenkakuV2ContractAddress}`)
  console.log(`Nengajo  : ${NengajoContract.address}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
