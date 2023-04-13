import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { ethers } from 'hardhat'
import { HenkakuToken, HenkakuToken__factory, Ticket, Ticket__factory } from '../typechain-types'
import { BigNumber } from 'ethers'
import { deployAndDistributeHenkakuV2, deployTicket } from './helper/deploy'

describe('RegisterTicket', () => {
  let TicketContract: Ticket
  let HenkakuTokenContract: HenkakuToken
  let deployer: SignerWithAddress
  let creator: SignerWithAddress
  let user1: SignerWithAddress
  let user2: SignerWithAddress
  let user3: SignerWithAddress
  let outsider: SignerWithAddress

  before(async () => {
    ;[deployer, creator, user1, user2, user3, outsider] = await ethers.getSigners()
    HenkakuTokenContract = await deployAndDistributeHenkakuV2({
      deployer,
      addresses: [creator.address, user1.address, user2.address, user3.address, deployer.address],
      amount: ethers.utils.parseEther('1000'),
    })
    TicketContract = await deployTicket(HenkakuTokenContract.address)
  })

  it('register creative', async () => {
    // Check the contents of tokenId #0, which is the default missing value.
    // デフォルト値の欠番としたtokenId #0の内容を確認
    let tokenURI
    tokenURI = await TicketContract.uri(0)
    expect(tokenURI).equal('')

    let getAllRegisteredTickets
    getAllRegisteredTickets = await TicketContract.retrieveAllTickets()
    expect(getAllRegisteredTickets.length).to.equal(1)
    expect(getAllRegisteredTickets[0].uri).to.equal('')
    expect(getAllRegisteredTickets[0].creator).to.equal(ethers.constants.AddressZero)
    expect(getAllRegisteredTickets[0].maxSupply).to.equal(0)

    let getRegisteredTicket
    getRegisteredTicket = await TicketContract.retrieveRegisteredTicket(0)
    expect(getRegisteredTicket.uri).to.equal('')
    expect(getRegisteredTicket.creator).to.equal(ethers.constants.AddressZero)
    expect(getRegisteredTicket.maxSupply).to.equal(0)

    await HenkakuTokenContract.connect(creator).approve(TicketContract.address, ethers.utils.parseEther('200'))
    // Register the first Ticket
    // １つ目の年賀状(_tokenIdが１)を登録

    let now = (await ethers.provider.getBlock('latest')).timestamp

    // @dev test emit register creative
    await expect(
      TicketContract.connect(creator).registerTicket(2, 'ipfs://test1', 100, now, now + 1000000000000, [creator.address, deployer.address], [60, 40])
    )
      .to.emit(TicketContract, 'RegisterTicket')
      .withArgs(creator.address, now, now + 1000000000000, 2, 1, 100, 'ipfs://test1', [60, 40], [creator.address, deployer.address])

    tokenURI = await TicketContract.uri(1)
    expect(tokenURI).equal('ipfs://test1')

    getAllRegisteredTickets = await TicketContract.retrieveAllTickets()
    // expect(getAllRegisteredTickets.length).to.equal(2)
    // expect(getAllRegisteredTickets[1].uri).to.equal('ipfs://test1')
    // expect(getAllRegisteredTickets[1].creator).to.equal(creator.address)
    // expect(getAllRegisteredTickets[1].maxSupply).to.equal(2)

    getRegisteredTicket = await TicketContract.retrieveRegisteredTicket(1)
    // expect(getRegisteredTicket.uri).to.equal('ipfs://test1')
    // expect(getRegisteredTicket.creator).to.equal(creator.address)
    // expect(getRegisteredTicket.maxSupply).to.equal(2)

    const registeredTickets = await TicketContract.retrieveRegisteredTickets(creator.address)
    // expect(registeredTickets[0].uri).to.equal('ipfs://test1')
    // expect(registeredTickets[0].creator).to.equal(creator.address)
    // expect(registeredTickets[0].maxSupply).to.equal(2)
  })

  it('revert register creative', async () => {
    // @dev test revert register creative
    expect(await HenkakuTokenContract.balanceOf(outsider.address)).to.equal(0)
    await expect(TicketContract.connect(outsider).registerTicket(2, 'ipfs://test1', 100, 0, 0, [outsider.address, deployer.address], [60, 40])).to.be.revertedWith('Ticket: Insufficient HenkakuV2 token')
  })

})

describe('MintTicket', () => {
  let TicketContract: Ticket
  let HenkakuTokenContract: HenkakuToken
  let deployer: SignerWithAddress
  let creator: SignerWithAddress
  let user1: SignerWithAddress
  let user2: SignerWithAddress
  let user3: SignerWithAddress
  let user4: SignerWithAddress
  let outsider: SignerWithAddress

  before(async () => {
    ;[deployer, creator, user1, user2, user3, user4, outsider] = await ethers.getSigners()
    HenkakuTokenContract = await deployAndDistributeHenkakuV2({
      deployer,
      addresses: [creator.address, user1.address, user2.address, user3.address, deployer.address],
      amount: ethers.utils.parseEther('1000'),
    })

    TicketContract = await deployTicket(HenkakuTokenContract.address)
    await HenkakuTokenContract.connect(user1).approve(TicketContract.address, ethers.utils.parseEther('1000'))
    await HenkakuTokenContract.connect(user2).approve(TicketContract.address, ethers.utils.parseEther('1000'))

    let now = (await ethers.provider.getBlock('latest')).timestamp

    expect(await TicketContract.connect(creator).registerTicket(
      2,
      'ipfs://test1',
      100,
      now,
      now + 1000000000000,
      [creator.address, deployer.address],
      [60, 40]
    )).not.to.be.reverted

    expect(await TicketContract.connect(creator).registerTicket(
      2,
      'ipfs://test1',
      100,
      now,
      now + 1000000000000,
      [creator.address, deployer.address],
      [60, 40]
    )).not.to.be.reverted

    expect(await TicketContract.connect(creator).registerTicket(
      1,
      'ipfs://test1',
      100,
      now + 1000000000000,
      now + 1000000000000,
      [creator.address, deployer.address],
      [60, 40]
    )).not.to.be.reverted

    expect(await TicketContract.connect(creator).registerTicket(1, 'ipfs://test1', 100, now, 0, [creator.address, deployer.address], [60, 40])).not.to.be.reverted

    expect(await TicketContract.connect(creator).registerTicket(
      1,
      'ipfs://test1',
      100,
      now,
      now + 1000000000000,
      [creator.address, deployer.address],
      [60, 40]
    )).not.to.be.reverted
  })

  it('mint ticket', async () => {
    await TicketContract.connect(deployer).switchMintable()

    await TicketContract.connect(user1).mint(1)
    let balance = await TicketContract.connect(user1).balanceOf(user1.address, 1)
    expect(balance).to.equal(1)

    // @dev test emit mint
    await expect(TicketContract.connect(user2).mint(1)).to.emit(TicketContract, 'Mint').withArgs(user2.address, 1)

    //await TicketContract.connect(user2).mint(1)
    balance = await TicketContract.connect(user2).balanceOf(user2.address, 1)
    expect(balance).to.equal(1)
  })

  it('retrieve minted ticket', async () => {
    // URIs
    let mintedTicketInfo = await TicketContract.connect(user1).retrieveMintedTickets(user1.address)
    expect(mintedTicketInfo.length).equal(1)
    expect(mintedTicketInfo[0].uri).to.equal('ipfs://test1')
    // Register the second Ticket
    // ２つ目(_tokenIdが１)の年賀状を登録

    // // user1が年賀状を２枚め(_tokenIdが２)をミント
    await TicketContract.connect(user1).mint(2)
    mintedTicketInfo = await TicketContract.connect(user1).retrieveMintedTickets(user1.address)

    expect(mintedTicketInfo.length).equal(2)
    expect(mintedTicketInfo[0].id).to.equal(1)
    expect(mintedTicketInfo[1].id).to.equal(2)
    expect(mintedTicketInfo[0].uri).to.equal('ipfs://test1')
    expect(mintedTicketInfo[1].uri).to.equal('ipfs://test1')

    mintedTicketInfo = await TicketContract.connect(user2).retrieveMintedTickets(user2.address)

    expect(mintedTicketInfo.length).equal(1)
    expect(mintedTicketInfo[0].id).to.equal(1)
    expect(mintedTicketInfo[0].uri).to.equal('ipfs://test1')
  })

  it('failed with unavailable', async () => {
    // await expect(TicketContract.connect(user2).mint(1)).to.be.revertedWith('Ticket: not available')
    await expect(TicketContract.connect(user2).mint(999)).to.be.revertedWith('Ticket: not available')
  })

  it('failed with already have', async () => {
    await expect(TicketContract.connect(user2).mint(1)).to.be.revertedWith('Ticket: You already have this ticket')
  })

  it('failed with mint limit', async () => {
    await expect(TicketContract.connect(user3).mint(1)).to.be.revertedWith('Ticket: Mint limit reached')
  })

  it('failed with mint tokenId #2', async () => {
    await expect(TicketContract.connect(user3).mint(3)).to.be.revertedWith('Ticket: Not open yet')
  })

  it('failed with mint tokenId #2', async () => {
    await expect(TicketContract.connect(user3).mint(4)).to.be.revertedWith('Ticket: Already closed')
  })

  it('failed with insufficient Henkaku Token', async () => {
    await expect(TicketContract.connect(user4).mint(5)).to.be.revertedWith('Ticket: Insufficient HenkakuV2 token')
  })

  it('revert register creative', async () => {
    // @dev test revert register creative
    expect(await HenkakuTokenContract.balanceOf(outsider.address)).to.equal(0)
    await expect(TicketContract.connect(outsider).mint(5)).to.be.revertedWith('Ticket: Insufficient HenkakuV2 token')
  })
})

describe('CheckMintable', () => {
  let TicketContract: Ticket
  let HenkakuTokenContract: HenkakuToken
  let deployer: SignerWithAddress
  let creator: SignerWithAddress
  let user1: SignerWithAddress
  let user2: SignerWithAddress
  let user3: SignerWithAddress

  before(async () => {
    ;[deployer, creator, user1, user2, user3] = await ethers.getSigners()
    HenkakuTokenContract = await deployAndDistributeHenkakuV2({
      deployer,
      addresses: [creator.address, user1.address, user2.address, deployer.address],
      amount: ethers.utils.parseEther('100'),
    })
    TicketContract = await deployTicket(HenkakuTokenContract.address)
  })

  it('initial mintable flag is false', async () => {
    const mintable = await TicketContract.mintable()
    expect(mintable).to.equal(false)
  })

  it('initial admin is deployer', async () => {
    const admin = await TicketContract.isAdmin(deployer.address)
    expect(admin).to.equal(true)
  })

  it('initial admin is only deployer', async () => {
    const admin = await TicketContract.isAdmin(user1.address)
    expect(admin).to.equal(false)
  })

  it('only admins can add new admins', async () => {
    const newAdmins = [user1.address, user2.address]
    await expect(TicketContract.connect(creator).addAdmins(newAdmins)).to.be.revertedWith('Admins only')
  })

  it('add a new admin', async () => {
    const newAdmins = [creator.address]

    let isAdmin
    isAdmin = await TicketContract.isAdmin(creator.address)
    expect(isAdmin).to.equal(false)

    const addAdmins = await TicketContract.connect(deployer).addAdmins(newAdmins)
    await addAdmins.wait()

    isAdmin = await TicketContract.isAdmin(creator.address)
    expect(isAdmin).to.equal(true)
  })

  it('add new admins', async () => {
    const newAdmins = [user1.address, user2.address]

    let isAdmin
    isAdmin = await TicketContract.isAdmin(user1.address)
    expect(isAdmin).to.equal(false)
    isAdmin = await TicketContract.isAdmin(user2.address)
    expect(isAdmin).to.equal(false)

    const addAdmins = await TicketContract.connect(deployer).addAdmins(newAdmins)
    await addAdmins.wait()

    isAdmin = await TicketContract.isAdmin(user1.address)
    expect(isAdmin).to.equal(true)
    isAdmin = await TicketContract.isAdmin(user2.address)
    expect(isAdmin).to.equal(true)
  })

  it('delete an admin', async () => {
    let isAdmin
    isAdmin = await TicketContract.isAdmin(user2.address)
    expect(isAdmin).to.equal(true)

    const deleteAdmin = await TicketContract.connect(deployer).deleteAdmin(user2.address)
    await deleteAdmin.wait()

    isAdmin = await TicketContract.isAdmin(user2.address)
    expect(isAdmin).to.equal(false)
  })

  it('switch mintable flag', async () => {
    let mintable
    mintable = await TicketContract.mintable()
    expect(mintable).to.equal(false)

    let switchMintable
    switchMintable = await TicketContract.connect(deployer).switchMintable()

    mintable = await TicketContract.mintable()
    expect(mintable).to.equal(true)

    switchMintable = await TicketContract.connect(deployer).switchMintable()

    mintable = await TicketContract.mintable()
    expect(mintable).to.equal(false)
  })

  it('only admins can switch mintable flag', async () => {
    let mintable
    mintable = await TicketContract.mintable()
    expect(mintable).to.equal(false)

    await expect(TicketContract.connect(user3).switchMintable()).to.be.revertedWith('Admins only')

    mintable = await TicketContract.mintable()
    expect(mintable).to.equal(false)
  })
})

describe('check henkaku token transfer', () => {
  let TicketContract: Ticket
  let HenkakuTokenContract: HenkakuToken
  let deployer: SignerWithAddress
  let creator: SignerWithAddress
  let user1: SignerWithAddress
  let user2: SignerWithAddress

  before(async () => {
    ;[deployer, creator, user1, user2] = await ethers.getSigners()
    HenkakuTokenContract = await deployAndDistributeHenkakuV2({
      deployer,
      addresses: [creator.address, user1.address, user2.address, deployer.address],
      amount: ethers.utils.parseEther('1000'),
    })
    TicketContract = await deployTicket(HenkakuTokenContract.address)

    await HenkakuTokenContract.connect(user1).approve(TicketContract.address, ethers.utils.parseEther('1000'))
    await HenkakuTokenContract.connect(user2).approve(TicketContract.address, ethers.utils.parseEther('1000'))

    let now = (await ethers.provider.getBlock('latest')).timestamp
    expect(await TicketContract.connect(creator).registerTicket(
      1,
      'ipfs://test1',
      ethers.utils.parseEther('100'),
      now,
      now + 1000000000000,
      [creator.address, deployer.address],
      [ethers.utils.parseEther('60'), ethers.utils.parseEther('40')]
    )).not.to.be.reverted

    await TicketContract.connect(deployer).switchMintable()
  })

  it('success to transfer ticket', async () => {
    expect(await HenkakuTokenContract.balanceOf(user1.address)).to.be.equal(ethers.utils.parseEther('1000'))
    expect(await HenkakuTokenContract.balanceOf(creator.address)).to.be.equal(ethers.utils.parseEther('1000'))
    expect(await HenkakuTokenContract.balanceOf(deployer.address)).to.be.equal(ethers.utils.parseEther('1000'))

    const tx = await TicketContract.connect(user1).mint(1)
    await tx.wait()

    expect(await HenkakuTokenContract.balanceOf(user1.address)).to.be.equal(ethers.utils.parseEther('900'))
    expect(await HenkakuTokenContract.balanceOf(creator.address)).to.be.equal(ethers.utils.parseEther('1060'))
    expect(await HenkakuTokenContract.balanceOf(deployer.address)).to.be.equal(ethers.utils.parseEther('1040'))
  })

  it('fail to mint and henkaku token is not transfered', async () => {
    await expect(TicketContract.connect(user2).mint(1)).revertedWith('Ticket: Mint limit reached')
    expect(await HenkakuTokenContract.balanceOf(user2.address)).to.be.equal(ethers.utils.parseEther('1000'))
    expect(await HenkakuTokenContract.balanceOf(creator.address)).to.be.equal(ethers.utils.parseEther('1060'))
    expect(await HenkakuTokenContract.balanceOf(deployer.address)).to.be.equal(ethers.utils.parseEther('1040'))
  })
})

describe('check timestamp', () => {
  let TicketContract: Ticket
  let HenkakuTokenContract: HenkakuToken
  let deployer: SignerWithAddress
  let creator: SignerWithAddress
  let user1: SignerWithAddress
  let user2: SignerWithAddress

  const day = 24 * 60 * 60
  const hour = 60 * 60
  const minute = 60
  const second = 1

  const calcRemainingTime = (time: number) => {
    const remainingTime = time

    const days = Math.floor(remainingTime / day)
    const hours = Math.floor((remainingTime % day) / hour)
    const minutes = Math.floor((remainingTime % hour) / minute)
    const seconds = Math.floor((remainingTime % minute) / second)
    const returnTime = `${days}日 ${hours}時間 ${minutes}分 ${seconds}秒`

    return returnTime
  }

  before(async () => {
    ;[deployer, creator, user1, user2] = await ethers.getSigners()
    HenkakuTokenContract = await deployAndDistributeHenkakuV2({
      deployer,
      addresses: [creator.address, user1.address, user2.address, deployer.address],
      amount: ethers.utils.parseEther('100'),
    })

    TicketContract = await deployTicket(HenkakuTokenContract.address)
  })
})

describe('after minting term', () => {
  let TicketContract: Ticket
  let HenkakuTokenContract: HenkakuToken
  let deployer: SignerWithAddress
  let creator: SignerWithAddress
  let user1: SignerWithAddress
  let user2: SignerWithAddress

  const day = 24 * 60 * 60
  const hour = 60 * 60
  const minute = 60
  const second = 1

  const calcRemainingTime = (time: number) => {
    const remainingTime = time

    const days = Math.floor(remainingTime / day)
    const hours = Math.floor((remainingTime % day) / hour)
    const minutes = Math.floor((remainingTime % hour) / minute)
    const seconds = Math.floor((remainingTime % minute) / second)
    const returnTime = `${days}日 ${hours}時間 ${minutes}分 ${seconds}秒`

    return returnTime
  }

  before(async () => {
    ;[deployer, creator, user1, user2] = await ethers.getSigners()
    HenkakuTokenContract = await deployAndDistributeHenkakuV2({
      deployer,
      addresses: [creator.address, user1.address, user2.address, deployer.address],
      amount: ethers.utils.parseEther('100'),
    })
    TicketContract = await deployTicket(HenkakuTokenContract.address)
  })
})
