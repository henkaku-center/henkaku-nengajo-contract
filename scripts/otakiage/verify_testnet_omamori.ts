import { run } from "hardhat";
import { omamoriAddresses, otakiageAddresses, forwarderAddresses } from "./deployedContracts/testnetHoleSkyContracts";

const openBlockTimestamp = 0
const closeBlockTimestamp = 4102326000
const forwarderAddress = Object.values(forwarderAddresses)[0]
const omamoriAddress = Object.values(omamoriAddresses)[0]

const main = async () => {
  await run("verify:verify", {
    address: omamoriAddress,
    constructorArguments: [
      'Omamori 2024',
      'OMM24',
      openBlockTimestamp,
      closeBlockTimestamp,
      forwarderAddress
    ],
  });
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})