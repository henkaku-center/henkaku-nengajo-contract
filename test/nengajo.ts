import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { ethers } from 'hardhat'
import { Nengajo } from '../typechain-types'

describe('CreateNengajo', () => {
  let NengajoContract: Nengajo
  let creator: SignerWithAddress
  let user1: SignerWithAddress
  let user2: SignerWithAddress

  before(async () => {
    ;[creator, user1, user2] = await ethers.getSigners()
    const NengajoFactory = await ethers.getContractFactory('Nengajo')
    NengajoContract = await NengajoFactory.deploy('Henkaku Nengajo', 'HNJ')
    await NengajoContract.deployed()
  })

  it('register creative', async () => {
    await NengajoContract.connect(creator).registerCreative(1, 'ipfs://test1')
    const tokenURI = await NengajoContract.uri(1)
    expect(tokenURI).equal('ipfs://test1')
  })

  it('mint nengajo', async () => {
    await NengajoContract.connect(user1).mint(1)
    const balance = await NengajoContract.connect(user1).balanceOf(
      user1.address,
      1
    )
    expect(balance).equal(1)
  })

  it('failed with unavailable', async () => {
    await expect(NengajoContract.connect(user2).mint(1)).to.be.revertedWith(
      'not available'
    )
  })
})
