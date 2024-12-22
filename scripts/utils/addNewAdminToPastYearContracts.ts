import { Omamori, Forwarder } from '../../typechain-types'

export const addNewAdminToPastYearContracts = async (adminAddress: string, omamori: Omamori, forwarder: Forwarder) => {
  await omamori.addAdmins([adminAddress])
  await forwarder.addAdmins([adminAddress])
}