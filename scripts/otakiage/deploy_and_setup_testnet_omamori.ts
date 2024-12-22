import * as dotenv from 'dotenv'
import { omamoriTokenIdOffset, omamoriTypeCount, setUpOmamoriForTestEnv } from '../utils/setUpOmamoriForTestEnv'

dotenv.config()

const main = async () => {

  // テストネット専用のため、開催期限は限定しない
  const open_blockTimestamp: number = 0
  const close_blockTimestamp: number = 4102326000  // 2099年12月31日

  const setup = await setUpOmamoriForTestEnv(open_blockTimestamp, close_blockTimestamp)
  const OmamoriContract = setup.OmamoriContract
  const ForwarderContract = setup.ForwarderContract

  console.log(`Forwarder: ${await ForwarderContract.getAddress()}`)
  console.log(`Omamori  : ${await OmamoriContract.getAddress()}`)

  for (let i = 0; i <= omamoriTypeCount; i++) {
    await OmamoriContract.mint(i + omamoriTokenIdOffset)
  }

  await OmamoriContract.mint(0 + omamoriTokenIdOffset)
  console.log(`Omamori minted`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
