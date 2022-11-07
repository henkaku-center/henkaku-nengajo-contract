import { ethers } from 'hardhat'
import { Nengajo } from '../typechain-types'

const day = 24 * 60 * 60
const hour = 60 * 60
const minute = 60
const second = 1

const calcRemainingTime = (time: number) => {
  const remainingTime = time

  const days = Math.floor(remainingTime / day)
  const hours = Math.floor(remainingTime % day / hour)
  const minutes = Math.floor(remainingTime % hour / minute)
  const seconds = Math.floor(remainingTime % minute / second)
  const returnTime = `${days}日 ${hours}時間 ${minutes}分 ${seconds}秒`

  return returnTime
}

async function main() {
  let NengajoContract: Nengajo

  const open_blockTimestamp: number = 1672498800
  const close_blockTimestamp: number = 1704034800

  const NengajoFactory = await ethers.getContractFactory('Nengajo')
  NengajoContract = await NengajoFactory.deploy('Henkaku Nengajo', 'HNJ', open_blockTimestamp, close_blockTimestamp)
  await NengajoContract.deployed()

  const checkRemainingOpenTime = await NengajoContract.callStatic.checkRemainingOpenTime()

  const checkRemainingCloseTime = await NengajoContract.callStatic.checkRemainingCloseTime()

  console.log(`Nengajo contract deployed to ${NengajoContract.address}`)

  console.log(`open_blockTimestamp: ${checkRemainingOpenTime}`)
  console.log(`remainingOpenTime: ${calcRemainingTime(checkRemainingOpenTime.toNumber())}`)

  console.log(`close_blockTimestamp: ${checkRemainingCloseTime}`)
  console.log(`remainingCloseTime: ${calcRemainingTime(checkRemainingCloseTime.toNumber())}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
