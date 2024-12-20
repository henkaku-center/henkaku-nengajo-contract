import { run } from "hardhat";
import { omamoriAddresses, otakiageAddresses, forwarderAddresses } from "./deployedContracts/testnetHoleSkyContracts";

const forwarderAddress = forwarderAddresses['20241220-1']
const omamoriAddress = omamoriAddresses['20241220-1']

const main = async () => {
  await run("verify:verify", {
    address: otakiageAddresses['20241220-1'],
    constructorArguments: [
      forwarderAddress,
      omamoriAddress,
    ],
  });
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})