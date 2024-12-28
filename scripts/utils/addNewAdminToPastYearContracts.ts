import { Omamori, Forwarder } from '../../typechain-types'

export const addNewAdminToPastYearContracts = async (adminAddresses: string[], omamori: Omamori, forwarder: Forwarder) => {
  await omamori.addAdmins(adminAddresses)
  await forwarder.addAdmins(adminAddresses)
}