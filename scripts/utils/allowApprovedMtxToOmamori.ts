import { Omamori, Forwarder, Otakiage } from '../../typechain-types'

export const allowApprovedMtxToOmamori = async (OmamoriContract: Omamori, ForwarderContract: Forwarder, OtakiageContract: Otakiage) => {
  const x = OmamoriContract.interface.encodeFunctionData('setApprovalForAll', [OtakiageContract.address, true]).substring(0, 10)
  await ForwarderContract.whitelistMethod(OmamoriContract.address, x, true)
}
