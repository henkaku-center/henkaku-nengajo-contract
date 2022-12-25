import * as dotenv from 'dotenv'
import { ethers } from 'hardhat'

dotenv.config()

const main = async () => {
  const open_blockTimestamp: number = 1672542000
  const close_blockTimestamp: number = 1675220400
  const NengajoFactory = await ethers.getContractFactory('Nengajo')
  const NengajoContract = await NengajoFactory.deploy(
    'HENKAKU Nengajo',
    'HNJ',
    open_blockTimestamp,
    close_blockTimestamp
  )
  await NengajoContract.deployed()

  console.log(`NengajoContractAddress: ${NengajoContract.address}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
