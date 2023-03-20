import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { BigNumber } from 'ethers'
import { HenkakuToken, HenkakuToken__factory, Ticket__factory } from '../../typechain-types'
import { ethers } from 'hardhat'

export const deployTicket = async (henkakuTokenAddr: string) => {
  const TicketFactory = (await ethers.getContractFactory('Ticket')) as Ticket__factory
  const TicketContract = await TicketFactory.deploy('Henkaku Ticket', 'HNJ', henkakuTokenAddr)
  await TicketContract.deployed()
  return TicketContract
}

export const deployAndDistributeHenkakuV2: (params: {
  deployer: SignerWithAddress
  addresses: string[]
  amount: BigNumber
}) => Promise<HenkakuToken> = async ({ deployer, addresses, amount }) => {
  const HenkakuV2Factory = (await ethers.getContractFactory('HenkakuToken')) as HenkakuToken__factory
  const HenkakuV2Contract = await HenkakuV2Factory.connect(deployer).deploy()
  await HenkakuV2Contract.deployed()

  await HenkakuV2Contract.addWhitelistUsers(addresses)

  for (const address of addresses) {
    await HenkakuV2Contract.mint(address, amount)
  }

  return HenkakuV2Contract
}
