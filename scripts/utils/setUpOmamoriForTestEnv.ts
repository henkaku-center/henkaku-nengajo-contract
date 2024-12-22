import { ethers } from "hardhat";
import { Forwarder, Forwarder__factory, Omamori, Omamori__factory } from '../../typechain-types'
import { ContractTransactionResponse } from "ethers";

export const omamoriTypeCount = 6
export const omamoriTokenIdOffset = 1

export const getOmamoriMetaDataURL = async (tokenId: number) => {
  const urls: { [key: number]: string } = {
    1: "ipfs://QmZjvXzaAu8wvkjF94i5b6DAbEXZT6SRk35o4iSFrjhX9E",
    2: "ipfs://QmQQaNTatStcfn3859NvNqyqdigFcpHKXup4vUdJoWKy47",
    3: "ipfs://QmaenfxMgPbiRzMXWtyF7dhLy6i2zfruRwP6U5rKrZGSai",
    4: "ipfs://Qmb2rHt6VrtUt2AHB6hWVffNWtupDE5vtHzaeSYHTV48Ai",
    5: "ipfs://Qme6gxzJFBgkhNwKPrDWtaD1fMnRLLhMyqqpH63TkVUQ9Z",
    6: "ipfs://QmWDRXgZcqGhm8ZrU8FuWmQPtVf7t7Y5bZr73JSeCou4gP",
  };
  return urls[tokenId] || "";
}

export const setUpOmamoriForTestEnv = async (openBlockTimestamp: number, closeBlockTimestamp: number) => {
  let OmamoriContract: Omamori
  let ForwarderContract: Forwarder

  const ForwarderFactory = await ethers.getContractFactory('Forwarder') as unknown as Forwarder__factory
  ForwarderContract = await ForwarderFactory.deploy()

  // 昨年の御守りをテストネットで再現するためのものなので、2024でOK
  const OmamoriFactory = (await ethers.getContractFactory('Omamori')) as unknown as Omamori__factory
  OmamoriContract = await OmamoriFactory.deploy(
    'Omamori 2024',
    'OMM24',
    openBlockTimestamp,
    closeBlockTimestamp,
    await ForwarderContract.getAddress()
  )
  await OmamoriContract.waitForDeployment()

  await ForwarderContract.whitelistTarget(await OmamoriContract.getAddress(), true)
  const x = OmamoriContract.interface.encodeFunctionData('mint', [1]).substring(0, 10)
  await ForwarderContract.whitelistMethod(await OmamoriContract.getAddress(), x, true)

  for (let i = 0; i <= omamoriTypeCount; i++) {
    const tx = await OmamoriContract.registerNengajo(100, getOmamoriMetaDataURL(i + omamoriTokenIdOffset)) as ContractTransactionResponse
    await tx.wait()
  }

  return {
    OmamoriContract,
    ForwarderContract
  }
}