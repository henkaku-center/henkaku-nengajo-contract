import * as dotenv from 'dotenv'
import { ethers } from 'hardhat'
import { Forwarder, Omamori, Otakiage, Otakiage__factory } from '../../typechain-types'
import { deployAndSetupOtakiage } from '../utils/deployOtakiage'
import { setOtakiageCid, TEST_CID } from '../utils/setOtakiageCid'
import { omamoriAddresses, forwarderAddresses } from './deployedContracts/testnetHoleSkyContracts'

dotenv.config()

const main = async () => {
  const devAddress = "0xEef377Bdf67A227a744e386231fB3f264C158CDF"
  const adminAddress = devAddress

  const forwarderAddress = Object.values(forwarderAddresses)[0]
  const omamoriAddress = Object.values(omamoriAddresses)[0]

  console.log(`ForwarderAddress: ${forwarderAddress}`)
  console.log(`OmamoriAddress: ${omamoriAddress}`)

  const ForwarderFactory = await ethers.getContractFactory("Forwarder")
  const ForwarderContract = ForwarderFactory.attach(forwarderAddress) as unknown as Forwarder

  const OmamoriFactory = await ethers.getContractFactory("Omamori")
  const OmamoriContract = OmamoriFactory.attach(omamoriAddress) as unknown as Omamori

  console.log(`Forwarder: ${await ForwarderContract.getAddress()}`)
  console.log(`Omamori  : ${await OmamoriContract.getAddress()}`)

  const OtakiageFactory = (await ethers.getContractFactory('Otakiage')) as unknown as Otakiage__factory
  const OtakiageContract = await OtakiageFactory.deploy(
    await ForwarderContract.getAddress(),
    await OmamoriContract.getAddress(),
  )

  console.log(`Otakiage: ${await OtakiageContract.getAddress()}`)

  await setOtakiageCid(OtakiageContract, TEST_CID)

  console.log(`Otakiage CID set`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
