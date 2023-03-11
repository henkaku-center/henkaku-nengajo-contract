import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { ethers } from 'hardhat'
import { HenkakuToken, HenkakuToken__factory, Ticket, Ticket__factory } from '../typechain-types'
import { BigNumber } from 'ethers'

const open_blockTimestamp: number = 1672498800
const close_blockTimestamp: number = 1704034800

const deployAndDistributeHenkakuV2: (params: {
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

const calcRequiredHenkakuForRegister: (params: {
  TicketContract: Ticket
  address: SignerWithAddress
  maxSupply: number
}) => Promise<BigNumber> = async ({ TicketContract, address, maxSupply }) => {
  const registeredCount = (await TicketContract.retrieveRegisteredTickets(address.address)).reduce(
    (sum, current) => {
      return sum + current.maxSupply.toNumber()
    },
    0
  )
  let amount
  let totalMaxSupply = registeredCount + maxSupply
  if (totalMaxSupply <= 10) {
    amount = ethers.utils.parseEther('10')
  } else if (10 < totalMaxSupply || totalMaxSupply < 101) {
    amount = ethers.utils.parseEther(`${totalMaxSupply * 5 - 40}`)
  } else {
    amount = ethers.utils.parseEther(`${totalMaxSupply * 10 - 540}`)
  }
  return amount
}

describe('RegisterTicket', () => {
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
      addresses: [creator.address, user1.address, user2.address, user3.address, deployer.address],
      amount: ethers.utils.parseEther('1000'),
    })
    const TicketFactory = (await ethers.getContractFactory('Ticket')) as Ticket__factory
    TicketContract = await TicketFactory.deploy(
      'Henkaku Ticket',
      'HNJ',
      open_blockTimestamp,
      close_blockTimestamp,
      HenkakuTokenContract.address,
      deployer.address
    )
    await TicketContract.deployed()
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

    // @dev test emit register creative
    await expect(TicketContract.connect(creator).registerTicket(2, 'ipfs://test1'))
      .to.emit(TicketContract, 'RegisterTicket')
      .withArgs(creator.address, 1, 'ipfs://test1', 2)

    tokenURI = await TicketContract.uri(1)
    expect(tokenURI).equal('ipfs://test1')

    getAllRegisteredTickets = await TicketContract.retrieveAllTickets()
    expect(getAllRegisteredTickets.length).to.equal(2)
    expect(getAllRegisteredTickets[1].uri).to.equal('ipfs://test1')
    expect(getAllRegisteredTickets[1].creator).to.equal(creator.address)
    expect(getAllRegisteredTickets[1].maxSupply).to.equal(2)

    getRegisteredTicket = await TicketContract.retrieveRegisteredTicket(1)
    expect(getRegisteredTicket.uri).to.equal('ipfs://test1')
    expect(getRegisteredTicket.creator).to.equal(creator.address)
    expect(getRegisteredTicket.maxSupply).to.equal(2)

    const registeredTickets = await TicketContract.retrieveRegisteredTickets(creator.address)
    expect(registeredTickets[0].uri).to.equal('ipfs://test1')
    expect(registeredTickets[0].creator).to.equal(creator.address)
    expect(registeredTickets[0].maxSupply).to.equal(2)
  })

  it('check 1Henkaku transfered', async () => {
    const henkakuBalance = await HenkakuTokenContract.balanceOf(creator.address)
    expect(henkakuBalance).to.equal(ethers.utils.parseEther('990'))
  })

  it('failed register Ticket with insufficient henkaku token', async () => {
    // Ticket registration is reverted.
    // 年賀状の登録がリバートされる
    await expect(TicketContract.connect(creator).registerTicket(1000, 'ipfs://test1')).to.be.revertedWith(
      'Ticket: Insufficient HenkakuV2 token'
    )
  })

  it('Check expected henkaku token amount is transfered', async () => {
    const henkakuBalanceBefore = await HenkakuTokenContract.balanceOf(creator.address)
    const expectedHenkakuAmount = await calcRequiredHenkakuForRegister({
      TicketContract,
      address: creator,
      maxSupply: 10,
    })
    await TicketContract.connect(creator).registerTicket(10, 'ipfs://test1')
    const henkakuBalanceAfter = await HenkakuTokenContract.balanceOf(creator.address)
    expect(henkakuBalanceAfter).to.equal(henkakuBalanceBefore.sub(expectedHenkakuAmount))
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

  before(async () => {
    ;[deployer, creator, user1, user2, user3, user4] = await ethers.getSigners()
    HenkakuTokenContract = await deployAndDistributeHenkakuV2({
      deployer,
      addresses: [creator.address, user1.address, user2.address, user3.address, deployer.address],
      amount: ethers.utils.parseEther('1000'),
    })
    const TicketFactory = (await ethers.getContractFactory('Ticket')) as Ticket__factory
    TicketContract = await TicketFactory.deploy(
      'Henkaku Ticket',
      'HNJ',
      open_blockTimestamp,
      close_blockTimestamp,
      HenkakuTokenContract.address,
      deployer.address
    )
    await TicketContract.deployed()
    await HenkakuTokenContract.connect(creator).approve(TicketContract.address, ethers.utils.parseEther('1000'))
    await TicketContract.connect(creator).registerTicket(2, 'ipfs://test1')
  })

  it('mint Ticket', async () => {
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

  it('retrieve minted Ticket', async () => {
    // URIs
    let mintedTicketInfo = await TicketContract.connect(user1).retrieveMintedTickets(user1.address)
    expect(mintedTicketInfo.length).equal(1)
    expect(mintedTicketInfo[0].uri).to.equal('ipfs://test1')
    // Register the second Ticket
    // ２つ目(_tokenIdが１)の年賀状を登録
    await TicketContract.connect(creator).registerTicket(2, 'ipfs://test1')

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

  it('mint batch Tickets', async () => {
    // Register the third Ticket
    // ３つ目(_tokenIdが２)の年賀状を登録
    await TicketContract.connect(creator).registerTicket(2, 'ipfs://test4')
    // Register the fourth Ticket
    // 4つ目(_tokenIdが３)の年賀状を登録
    await TicketContract.connect(creator).registerTicket(2, 'ipfs://test4')

    // @dev test emit mint batch
    await expect(await TicketContract.connect(user3).mintBatch([3, 4]))
      .to.emit(TicketContract, 'MintBatch')
      .withArgs(user3.address, [3, 4])
    //await TicketContract.connect(user3).mintBatch([3, 4])

    let balance
    balance = await TicketContract.connect(user3).balanceOf(user3.address, 3)
    expect(balance).to.equal(1)

    balance = await TicketContract.connect(user3).balanceOf(user3.address, 4)
    expect(balance).to.equal(1)

    let mintedTicketInfo = await TicketContract.connect(user3).retrieveMintedTickets(user3.address)

    expect(mintedTicketInfo.length).equal(2)
    expect(mintedTicketInfo[0].id).to.equal(3)
    expect(mintedTicketInfo[1].id).to.equal(4)
    expect(mintedTicketInfo[0].uri).to.equal('ipfs://test4')
    expect(mintedTicketInfo[1].uri).to.equal('ipfs://test4')
  })

  it('mint batch failed with already have', async () => {
    // Confirmed that even with the mintBatch function, it is not possible to mint more than two Tickets.
    // mintBatch関数でも同じ年賀状を2つ以上ミント出来ないことを確認
    await expect(TicketContract.connect(user3).mintBatch([3, 4])).to.be.revertedWith(
      'Ticket: You already have this Ticket'
    )

    // Confirm that balance, etc. has not changed.
    // balance等が変わっていないことを確認
    let balance
    balance = await TicketContract.connect(user3).balanceOf(user3.address, 3)
    expect(balance).to.equal(1)

    balance = await TicketContract.connect(user3).balanceOf(user3.address, 4)
    expect(balance).to.equal(1)

    let mintedTicketInfo = await TicketContract.connect(user3).retrieveMintedTickets(user3.address)

    expect(mintedTicketInfo.length).equal(2)
    expect(mintedTicketInfo[0].id).to.equal(3)
    expect(mintedTicketInfo[1].id).to.equal(4)
    expect(mintedTicketInfo[0].uri).to.equal('ipfs://test4')
    expect(mintedTicketInfo[1].uri).to.equal('ipfs://test4')
  })

  it('failed with unavailable', async () => {
    // await expect(TicketContract.connect(user2).mint(1)).to.be.revertedWith('Ticket: not available')
    await expect(TicketContract.connect(user2).mint(999)).to.be.revertedWith('Ticket: not available')
  })

  it('failed with already have', async () => {
    await expect(TicketContract.connect(user2).mint(1)).to.be.revertedWith('Ticket: You already have this Ticket')
  })

  it('failed with mint limit', async () => {
    await expect(TicketContract.connect(user3).mint(1)).to.be.revertedWith('Ticket: Mint limit reached')
  })

  it('failed with mint tokenId #0', async () => {
    await expect(TicketContract.connect(user3).mint(0)).to.be.revertedWith('Ticket: Mint limit reached')
  })

  it('failed with insufficient Henkaku Token', async () => {
    await expect(TicketContract.connect(user4).mint(2)).to.be.revertedWith(
      'Ticket: Insufficient Henkaku Token Balance'
    )
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
    const TicketFactory = (await ethers.getContractFactory('Ticket')) as Ticket__factory
    TicketContract = await TicketFactory.deploy(
      'Henkaku Ticket',
      'HNJ',
      open_blockTimestamp,
      close_blockTimestamp,
      HenkakuTokenContract.address,
      deployer.address
    )
    await TicketContract.deployed()
    HenkakuTokenContract = await deployAndDistributeHenkakuV2({
      deployer,
      addresses: [creator.address, user1.address, user2.address],
      amount: ethers.utils.parseEther('100'),
    })
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

  it('check pool address changed', async () => {
    let pool
    pool = await TicketContract.henkakuPoolWallet()
    // The initial value of Wallet in Pool is set to deployer.
    // PoolのWalletの初期値はdeployerに設定されている。
    expect(pool).to.equal(deployer.address)

    await (await TicketContract.connect(deployer).changeHenkakuPool(user1.address)).wait()

    pool = await TicketContract.henkakuPoolWallet()
    expect(pool).to.equal(user1.address)
  })

  it('check pool address cannot be changed except by admin', async () => {
    let pool
    pool = await TicketContract.henkakuPoolWallet()
    expect(pool).to.equal(user1.address)

    expect(await TicketContract.connect(user1).changeHenkakuPool(user2.address)).to.revertedWith(
      'Henkaku Pool: same address'
    )
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
    const TicketFactory = (await ethers.getContractFactory('Ticket')) as Ticket__factory
    TicketContract = await TicketFactory.deploy(
      'Henkaku Ticket',
      'HNJ',
      open_blockTimestamp,
      close_blockTimestamp,
      HenkakuTokenContract.address,
      deployer.address
    )
    await TicketContract.deployed()
  })

  it('check remaining open time', async () => {
    const checkRemainingOpenTime = await TicketContract.callStatic.checkRemainingOpenTime()
    expect(checkRemainingOpenTime.toNumber()).to.below(4676081)
  })

  it('check remaining close time', async () => {
    const checkRemainingCloseTime = await TicketContract.callStatic.checkRemainingCloseTime()
    expect(checkRemainingCloseTime.toNumber()).to.below(36212059)
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
    const TicketFactory = (await ethers.getContractFactory('Ticket')) as Ticket__factory
    TicketContract = await TicketFactory.deploy(
      'Henkaku Ticket',
      'HNJ',
      946652400,
      946652400,
      HenkakuTokenContract.address,
      deployer.address
    )
    await TicketContract.deployed()
  })

  it('check remaining open time', async () => {
    const checkRemainingOpenTime = await TicketContract.callStatic.checkRemainingOpenTime()
    expect(checkRemainingOpenTime.toNumber()).to.equal(0)
  })

  it('check remaining close time', async () => {
    const checkRemainingCloseTime = await TicketContract.callStatic.checkRemainingCloseTime()
    expect(checkRemainingCloseTime.toNumber()).to.equal(0)
  })

  it('failed with minting time', async () => {
    const checkRemainingOpenTime = await TicketContract.callStatic.checkRemainingOpenTime()

    const checkRemainingCloseTime = await TicketContract.callStatic.checkRemainingCloseTime()
    await HenkakuTokenContract.connect(creator).approve(TicketContract.address, ethers.utils.parseEther('200'))
    await TicketContract.connect(creator).registerTicket(1, 'ipfs://test1')
    const tokenURI = await TicketContract.uri(1)
    expect(tokenURI).equal('ipfs://test1')

    let mintable
    mintable = await TicketContract.mintable()
    expect(mintable).to.equal(false)

    if (checkRemainingOpenTime || (!checkRemainingCloseTime && !mintable)) {
      await expect(TicketContract.connect(user1).mint(1)).to.be.revertedWith('Ticket: Not mintable')
    }
  })
})
