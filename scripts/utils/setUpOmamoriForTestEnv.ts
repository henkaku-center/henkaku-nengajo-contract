import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ethers as hardhatEthers } from 'hardhat'
import { Forwarder, Forwarder__factory, Omamori, Omamori__factory } from '../../typechain-types'

export const omamoriTypeCount = 6
export const omamoriTokenIdOffset = 1

export const getOmamoriMetaDataURL = async (tokenId: number) => {
  return `https://test.${tokenId}.com`
}

export const setUpOmamoriForTestEnv = async (creator: SignerWithAddress, user1: SignerWithAddress, user2: SignerWithAddress, openBlockTimestamp: number, closeBlockTimestamp: number) => {
  let OmamoriContract: Omamori
  let ForwarderContract: Forwarder

  const ForwarderFactory = (await hardhatEthers.getContractFactory('Forwarder')) as Forwarder__factory
  ForwarderContract = await ForwarderFactory.deploy()

  const OmamoriFactory = (await hardhatEthers.getContractFactory('Omamori')) as Omamori__factory
  OmamoriContract = await OmamoriFactory.deploy(
    'Omamori',
    'OMORI',
    openBlockTimestamp,
    closeBlockTimestamp,
    ForwarderContract.address
  )
  await OmamoriContract.deployed()

  await ForwarderContract.whitelistTarget(OmamoriContract.address, true)
  const x = OmamoriContract.interface.encodeFunctionData('mint', [1]).substring(0, 10)
  await ForwarderContract.whitelistMethod(OmamoriContract.address, x, true)

  await OmamoriContract.addAdmins([creator.address])

  for (let i = 0; i <= omamoriTypeCount; i++) {
    await OmamoriContract.connect(creator).registerNengajo(100, getOmamoriMetaDataURL(i + omamoriTokenIdOffset))
  }

  for (let i = 0; i <= omamoriTypeCount; i++) {
    await OmamoriContract.connect(user1).mint(i + omamoriTokenIdOffset)
  }

  await OmamoriContract.connect(user2).mint(0 + omamoriTokenIdOffset)

  return {
    OmamoriContract,
    ForwarderContract
  }
}