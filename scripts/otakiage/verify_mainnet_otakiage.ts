import { run } from "hardhat";
import { omamoriAddresses, otakiageAddresses, forwarderAddresses } from "./deployedContracts/mainnetPolygonContracts";

const forwarderAddress = Object.values(forwarderAddresses)[0]
const omamoriAddress = Object.values(omamoriAddresses)[0]
const otakiageAddress = Object.values(otakiageAddresses)[0]

const main = async () => {
  await run("verify:verify", {
    address: otakiageAddress,
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