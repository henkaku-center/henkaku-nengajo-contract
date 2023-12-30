import * as dotenv from 'dotenv'
import { ethers } from 'hardhat'

dotenv.config()

const main = async () => {
  const open_blockTimestamp: number = 1704078000
  const close_blockTimestamp: number = 1706756400
  const NengajoFactory = await ethers.getContractFactory('Nengajo')
  const NengajoContract = await NengajoFactory.deploy(
    'HENKAKU Nengajo 2024',
    'HNJ2024',
    open_blockTimestamp,
    close_blockTimestamp,
    process.env.HENKAKU_V2_ADDRESS!,
    process.env.POOL_WALLET_ADDRESS!,
    process.env.FORWARDER_ADDRESS!
  )
  await NengajoContract.deployed()

  console.log(`NengajoContractAddress: ${NengajoContract.address}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
