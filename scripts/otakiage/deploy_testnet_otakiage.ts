import * as dotenv from 'dotenv'
import { addNewAdminToPastYearContracts } from '../utils/addNewAdminToPastYearContracts'
import { ethers } from 'hardhat'
import { Forwarder, Omamori, Otakiage } from '../../typechain-types'
import { deployAndSetupOtakiage } from '../utils/deployAndSetupOtakiage'
import { setOtakiageCid, TEST_CID } from '../utils/setOtakiageCid'
import { allowApprovedMtxToOmamori } from '../utils/allowApprovedMtxToOmamori'
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
  const ForwarderContract = ForwarderFactory.attach(forwarderAddress) as Forwarder

  const OmamoriFactory = await ethers.getContractFactory("Omamori")
  const OmamoriContract = OmamoriFactory.attach(omamoriAddress) as Omamori

  console.log(`Forwarder: ${ForwarderContract.address}`)
  console.log(`Omamori  : ${OmamoriContract.address}`)

  await addNewAdminToPastYearContracts(adminAddress, OmamoriContract, ForwarderContract)

  const result = await deployAndSetupOtakiage(ForwarderContract, OmamoriContract)
  const OtakiageContract: Otakiage = result.OtakiageContract

  console.log(`Otakiage: ${OtakiageContract.address}`)

  await setOtakiageCid(OtakiageContract, TEST_CID)

  console.log(`Otakiage CID set`)

  await allowApprovedMtxToOmamori(OmamoriContract, ForwarderContract, OtakiageContract)

  console.log(`Approved MTX to Omamori`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
