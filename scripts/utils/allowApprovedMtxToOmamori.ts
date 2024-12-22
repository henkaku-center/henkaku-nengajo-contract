import { Omamori, Forwarder, Otakiage } from '../../typechain-types'

export const allowApprovedMtxToOmamori = async (OmamoriContract: Omamori, ForwarderContract: Forwarder, OtakiageContract: Otakiage) => {
  const x = OmamoriContract.interface.encodeFunctionData('setApprovalForAll', [await OtakiageContract.getAddress(), true]).substring(0, 10)
  await ForwarderContract.whitelistMethod(await OmamoriContract.getAddress(), x, true)
}
