import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { Omamori, Forwarder } from '../../typechain-types'

export const addNewAdminToPastYearContracts = async (admin: SignerWithAddress, omamori: Omamori, forwarder: Forwarder) => {
  await omamori.addAdmins([admin.address])
  await forwarder.addAdmins([admin.address])
}
