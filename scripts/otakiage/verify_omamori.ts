import { run } from "hardhat";
import { omamoriAddresses, otakiageAddresses, forwarderAddresses } from "./deployedContracts/testnetHoleSkyContracts";

const openBlockTimestamp = 0
const closeBlockTimestamp = 4102326000
const forwarderAddress = forwarderAddresses['20241220-1']

const main = async () => {
  await run("verify:verify", {
    address: omamoriAddresses['20241220-1'],
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