import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ethers as hardhatEthers } from 'hardhat'
import { Forwarder, Forwarder__factory, Omamori, Otakiage, Otakiage__factory } from '../../typechain-types'

export const deployAndSetupOtakiage = async (ForwarderContract: Forwarder, OmamoriContract: Omamori) => {
  const OtakiageFactory = (await hardhatEthers.getContractFactory('Otakiage')) as Otakiage__factory
  const OtakiageContract = await OtakiageFactory.deploy(
    ForwarderContract.address,
    OmamoriContract.address,
  )

  await ForwarderContract.whitelistTarget(OtakiageContract.address, true)
  const x = OtakiageContract.interface.encodeFunctionData('sendAllOmamori').substring(0, 10)
  await ForwarderContract.whitelistMethod(OtakiageContract.address, x, true)

  return { OtakiageContract }
}
