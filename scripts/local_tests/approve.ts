import * as dotenv from 'dotenv'
import { setBalance } from '@nomicfoundation/hardhat-network-helpers'
import { ethers } from 'hardhat'

dotenv.config()

const main = async () => {
  // chainIdを取得
  const chainId = (await ethers.provider.getNetwork()).chainId

  // chainIdが31337でなければ終了
  if (chainId !== 31337) {
    console.error('chainId is not 1337')
    process.exitCode = 1
    return
  } else {
    // userアドレスを取得
    let [user] = await ethers.getSigners()

    const localUserAddresses = String(process.env.LOCAL_USERS_ADDRESSES).split(',')
    for (const address of localUserAddresses) {
      await setBalance(address, 100n ** 9n)
    }

    const HenkakuV2Factory = await ethers.getContractFactory('HenkakuToken')
    const HenkakuV2Contract = await HenkakuV2Factory.attach('0x5FbDB2315678afecb367f032d93F642f64180aa3')

    let currentAllowance
    currentAllowance = await HenkakuV2Contract.allowance(user.address, '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9')

    console.log('pre approve:', currentAllowance.toString())

    await (
      await HenkakuV2Contract.connect(user).approve(
        '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
        currentAllowance.add(100)
      )
    ).wait()

    currentAllowance = await HenkakuV2Contract.allowance(user.address, '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9')

    console.log('post approve:', currentAllowance.toString())

    // const open_blockTimestamp: number = 1671458400
    // const close_blockTimestamp: number = 2671458400
    // const NengajoFactory = await ethers.getContractFactory('Nengajo')
    // const NengajoContract = await NengajoFactory.deploy(
    //   'Henkaku Nengajo',
    //   'HNJ',
    //   open_blockTimestamp,
    //   close_blockTimestamp,
    //   HenkakuV2Contract.address,
    //   localUserAddresses[0]
    // )
    // await NengajoContract.deployed()

    // console.log(`HenkakuV2: ${HenkakuV2Contract.address}`)
    // console.log(`Nengajo  : ${NengajoContract.address}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
