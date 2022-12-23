import * as dotenv from 'dotenv'
import { ethers } from 'hardhat'

dotenv.config()

const main = async () => {
  const open_blockTimestamp: number = 0
  const close_blockTimestamp: number = 1000000000
  const NengajoFactory = await ethers.getContractFactory('Nengajo')
  const NengajoContract = await NengajoFactory.deploy(
    'Henkaku Nengajo',
    'HNJ',
    open_blockTimestamp,
    close_blockTimestamp,
    process.env.HENKAKU_V2_ADDRESS!,
    process.env.POOL_WALLET_ADDRESS!
  )
  await NengajoContract.deployed()

  console.log(`Nengajo  : ${NengajoContract.address}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
