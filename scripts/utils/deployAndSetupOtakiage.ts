import { ethers as hardhatEthers } from 'hardhat'
import { Forwarder, Forwarder__factory, Omamori, Otakiage, Otakiage__factory } from '../../typechain-types'

export const deployAndSetupOtakiage = async (ForwarderContract: Forwarder, OmamoriContract: Omamori) => {
  const OtakiageFactory = (await hardhatEthers.getContractFactory('Otakiage')) as unknown as Otakiage__factory
  const OtakiageContract = await OtakiageFactory.deploy(
    await ForwarderContract.getAddress(),
    await OmamoriContract.getAddress(),
  )

  await ForwarderContract.whitelistTarget(await OtakiageContract.getAddress(), true)
  const x = OtakiageContract.interface.encodeFunctionData('sendAllOmamori').substring(0, 10)
  await ForwarderContract.whitelistMethod(await OtakiageContract.getAddress(), x, true)

  return { OtakiageContract }
}
