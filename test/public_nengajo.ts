import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { ethers } from 'hardhat'
import { PublicNengajo, PublicNengajo__factory } from '../typechain-types'

const open_blockTimestamp: number = 1672498800
const close_blockTimestamp: number = 1704034800

describe('RegisterNengajo', () => {
  let NengajoContract: PublicNengajo
  let deployer: SignerWithAddress
  let creator: SignerWithAddress
  let user1: SignerWithAddress
  let user2: SignerWithAddress
  let user3: SignerWithAddress

  before(async () => {
    ;[deployer, creator, user1, user2, user3] = await ethers.getSigners()
    const NengajoFactory = (await ethers.getContractFactory('PublicNengajo')) as PublicNengajo__factory
    NengajoContract = await NengajoFactory.connect(deployer).deploy(
      'Henkaku Nengajo',
      'HNJ',
      open_blockTimestamp,
      close_blockTimestamp,
      deployer.address
    )
    await NengajoContract.deployed()
    await NengajoContract.addAdmins([creator.address])
  })

  it('register creative', async () => {
    // Check the contents of tokenId #0, which is the default missing value.
    // デフォルト値の欠番としたtokenId #0の内容を確認
    let tokenURI
    tokenURI = await NengajoContract.uri(0)
    expect(tokenURI).equal('')

    let getAllRegisteredNengajos
    getAllRegisteredNengajos = await NengajoContract.retrieveAllNengajoes()
    expect(getAllRegisteredNengajos.length).to.equal(1)
    expect(getAllRegisteredNengajos[0].uri).to.equal('')
    expect(getAllRegisteredNengajos[0].creator).to.equal(ethers.constants.AddressZero)
    expect(getAllRegisteredNengajos[0].maxSupply).to.equal(0)

    let getRegisteredNengajo
    getRegisteredNengajo = await NengajoContract.retrieveRegisteredNengajo(0)
    expect(getRegisteredNengajo.uri).to.equal('')
    expect(getRegisteredNengajo.creator).to.equal(ethers.constants.AddressZero)
    expect(getRegisteredNengajo.maxSupply).to.equal(0)

    // @dev test emit register creative
    await expect(NengajoContract.connect(creator).registerNengajo(2, 'ipfs://test1'))
      .to.emit(NengajoContract, 'RegisterNengajo')
      .withArgs(creator.address, 1, 'ipfs://test1', 2)

    tokenURI = await NengajoContract.uri(1)
    expect(tokenURI).equal('ipfs://test1')

    getAllRegisteredNengajos = await NengajoContract.retrieveAllNengajoes()
    expect(getAllRegisteredNengajos.length).to.equal(2)
    expect(getAllRegisteredNengajos[1].uri).to.equal('ipfs://test1')
    expect(getAllRegisteredNengajos[1].creator).to.equal(creator.address)
    expect(getAllRegisteredNengajos[1].maxSupply).to.equal(2)

    getRegisteredNengajo = await NengajoContract.retrieveRegisteredNengajo(1)
    expect(getRegisteredNengajo.uri).to.equal('ipfs://test1')
    expect(getRegisteredNengajo.creator).to.equal(creator.address)
    expect(getRegisteredNengajo.maxSupply).to.equal(2)

    const registeredNengajoes = await NengajoContract.retrieveRegisteredNengajoes(creator.address)
    expect(registeredNengajoes[0].uri).to.equal('ipfs://test1')
    expect(registeredNengajoes[0].creator).to.equal(creator.address)
    expect(registeredNengajoes[0].maxSupply).to.equal(2)
  })
})

describe('MintNengajo', () => {
  let NengajoContract: PublicNengajo
  let deployer: SignerWithAddress
  let creator: SignerWithAddress
  let user1: SignerWithAddress
  let user2: SignerWithAddress
  let user3: SignerWithAddress
  let user4: SignerWithAddress

  before(async () => {
    ;[deployer, creator, user1, user2, user3, user4] = await ethers.getSigners()

    const NengajoFactory = (await ethers.getContractFactory('PublicNengajo')) as PublicNengajo__factory
    NengajoContract = await NengajoFactory.deploy(
      'Henkaku Nengajo',
      'HNJ',
      open_blockTimestamp,
      close_blockTimestamp,
      deployer.address
    )
    await NengajoContract.deployed()
    await NengajoContract.addAdmins([creator.address])
    await NengajoContract.connect(creator).registerNengajo(2, 'ipfs://test1')
  })

  it('mint nengajo', async () => {
    await NengajoContract.connect(deployer).switchMintable()

    await NengajoContract.connect(user1).mint(1)
    let balance = await NengajoContract.connect(user1).balanceOf(user1.address, 1)
    expect(balance).to.equal(1)

    // @dev test emit mint
    await expect(NengajoContract.connect(user2).mint(1)).to.emit(NengajoContract, 'Mint').withArgs(user2.address, 1)

    //await NengajoContract.connect(user2).mint(1)
    balance = await NengajoContract.connect(user2).balanceOf(user2.address, 1)
    expect(balance).to.equal(1)
  })

  it('retrieve minted nengajo', async () => {
    // URIs
    let mintedNengajoInfo = await NengajoContract.connect(user1).retrieveMintedNengajoes(user1.address)
    expect(mintedNengajoInfo.length).equal(1)
    expect(mintedNengajoInfo[0].uri).to.equal('ipfs://test1')
    // Register the second Nengajo
    // ２つ目(_tokenIdが１)の年賀状を登録
    await NengajoContract.connect(creator).registerNengajo(2, 'ipfs://test1')

    // // user1が年賀状を２枚め(_tokenIdが２)をミント
    await NengajoContract.connect(user1).mint(2)
    mintedNengajoInfo = await NengajoContract.connect(user1).retrieveMintedNengajoes(user1.address)

    expect(mintedNengajoInfo.length).equal(2)
    expect(mintedNengajoInfo[0].id).to.equal(1)
    expect(mintedNengajoInfo[1].id).to.equal(2)
    expect(mintedNengajoInfo[0].uri).to.equal('ipfs://test1')
    expect(mintedNengajoInfo[1].uri).to.equal('ipfs://test1')

    mintedNengajoInfo = await NengajoContract.connect(user2).retrieveMintedNengajoes(user2.address)

    expect(mintedNengajoInfo.length).equal(1)
    expect(mintedNengajoInfo[0].id).to.equal(1)
    expect(mintedNengajoInfo[0].uri).to.equal('ipfs://test1')
  })

  it('mint batch nengajos', async () => {
    // Register the third Nengajo
    // ３つ目(_tokenIdが２)の年賀状を登録
    await NengajoContract.connect(creator).registerNengajo(2, 'ipfs://test4')
    // Register the fourth Nengajo
    // 4つ目(_tokenIdが３)の年賀状を登録
    await NengajoContract.connect(creator).registerNengajo(2, 'ipfs://test4')

    // @dev test emit mint batch
    await expect(await NengajoContract.connect(user3).mintBatch([3, 4]))
      .to.emit(NengajoContract, 'MintBatch')
      .withArgs(user3.address, [3, 4])
    //await NengajoContract.connect(user3).mintBatch([3, 4])

    let balance
    balance = await NengajoContract.connect(user3).balanceOf(user3.address, 3)
    expect(balance).to.equal(1)

    balance = await NengajoContract.connect(user3).balanceOf(user3.address, 4)
    expect(balance).to.equal(1)

    let mintedNengajoInfo = await NengajoContract.connect(user3).retrieveMintedNengajoes(user3.address)

    expect(mintedNengajoInfo.length).equal(2)
    expect(mintedNengajoInfo[0].id).to.equal(3)
    expect(mintedNengajoInfo[1].id).to.equal(4)
    expect(mintedNengajoInfo[0].uri).to.equal('ipfs://test4')
    expect(mintedNengajoInfo[1].uri).to.equal('ipfs://test4')
  })

  it('mint batch failed with already have', async () => {
    // Confirmed that even with the mintBatch function, it is not possible to mint more than two Nengajos.
    // mintBatch関数でも同じ年賀状を2つ以上ミント出来ないことを確認
    await expect(NengajoContract.connect(user3).mintBatch([3, 4])).to.be.revertedWith(
      'Nengajo: You already have this nengajo'
    )

    // Confirm that balance, etc. has not changed.
    // balance等が変わっていないことを確認
    let balance
    balance = await NengajoContract.connect(user3).balanceOf(user3.address, 3)
    expect(balance).to.equal(1)

    balance = await NengajoContract.connect(user3).balanceOf(user3.address, 4)
    expect(balance).to.equal(1)

    let mintedNengajoInfo = await NengajoContract.connect(user3).retrieveMintedNengajoes(user3.address)

    expect(mintedNengajoInfo.length).equal(2)
    expect(mintedNengajoInfo[0].id).to.equal(3)
    expect(mintedNengajoInfo[1].id).to.equal(4)
    expect(mintedNengajoInfo[0].uri).to.equal('ipfs://test4')
    expect(mintedNengajoInfo[1].uri).to.equal('ipfs://test4')
  })

  it('failed with unavailable', async () => {
    // await expect(NengajoContract.connect(user2).mint(1)).to.be.revertedWith('Nengajo: not available')
    await expect(NengajoContract.connect(user2).mint(999)).to.be.revertedWith('Nengajo: not available')
  })

  it('failed with already have', async () => {
    await expect(NengajoContract.connect(user2).mint(1)).to.be.revertedWith('Nengajo: You already have this nengajo')
  })

  it('failed with mint limit', async () => {
    await expect(NengajoContract.connect(user3).mint(1)).to.be.revertedWith('Nengajo: Mint limit reached')
  })

  it('failed with mint tokenId #0', async () => {
    await expect(NengajoContract.connect(user3).mint(0)).to.be.revertedWith('Nengajo: Mint limit reached')
  })
})

describe('CheckMintable', () => {
  let NengajoContract: PublicNengajo
  let deployer: SignerWithAddress
  let creator: SignerWithAddress
  let user1: SignerWithAddress
  let user2: SignerWithAddress
  let user3: SignerWithAddress

  before(async () => {
    ;[deployer, creator, user1, user2, user3] = await ethers.getSigners()
    const NengajoFactory = (await ethers.getContractFactory('PublicNengajo')) as PublicNengajo__factory
    NengajoContract = await NengajoFactory.deploy(
      'Henkaku Nengajo',
      'HNJ',
      open_blockTimestamp,
      close_blockTimestamp,
      deployer.address
    )
    await NengajoContract.deployed()
  })

  it('initial mintable flag is false', async () => {
    const mintable = await NengajoContract.mintable()
    expect(mintable).to.equal(false)
  })

  it('initial admin is deployer', async () => {
    const admin = await NengajoContract.isAdmin(deployer.address)
    expect(admin).to.equal(true)
  })

  it('initial admin is only deployer', async () => {
    const admin = await NengajoContract.isAdmin(user1.address)
    expect(admin).to.equal(false)
  })

  it('only admins can add new admins', async () => {
    const newAdmins = [user1.address, user2.address]
    await expect(NengajoContract.connect(creator).addAdmins(newAdmins)).to.be.revertedWith('Admins only')
  })

  it('add a new admin', async () => {
    const newAdmins = [creator.address]

    let isAdmin
    isAdmin = await NengajoContract.isAdmin(creator.address)
    expect(isAdmin).to.equal(false)

    const addAdmins = await NengajoContract.connect(deployer).addAdmins(newAdmins)
    await addAdmins.wait()

    isAdmin = await NengajoContract.isAdmin(creator.address)
    expect(isAdmin).to.equal(true)
  })

  it('add new admins', async () => {
    const newAdmins = [user1.address, user2.address]

    let isAdmin
    isAdmin = await NengajoContract.isAdmin(user1.address)
    expect(isAdmin).to.equal(false)
    isAdmin = await NengajoContract.isAdmin(user2.address)
    expect(isAdmin).to.equal(false)

    const addAdmins = await NengajoContract.connect(deployer).addAdmins(newAdmins)
    await addAdmins.wait()

    isAdmin = await NengajoContract.isAdmin(user1.address)
    expect(isAdmin).to.equal(true)
    isAdmin = await NengajoContract.isAdmin(user2.address)
    expect(isAdmin).to.equal(true)
  })

  it('delete an admin', async () => {
    let isAdmin
    isAdmin = await NengajoContract.isAdmin(user2.address)
    expect(isAdmin).to.equal(true)

    const deleteAdmin = await NengajoContract.connect(deployer).deleteAdmin(user2.address)
    await deleteAdmin.wait()

    isAdmin = await NengajoContract.isAdmin(user2.address)
    expect(isAdmin).to.equal(false)
  })

  it('switch mintable flag', async () => {
    let mintable
    mintable = await NengajoContract.mintable()
    expect(mintable).to.equal(false)

    let switchMintable
    switchMintable = await NengajoContract.connect(deployer).switchMintable()

    mintable = await NengajoContract.mintable()
    expect(mintable).to.equal(true)

    switchMintable = await NengajoContract.connect(deployer).switchMintable()

    mintable = await NengajoContract.mintable()
    expect(mintable).to.equal(false)
  })

  it('only admins can switch mintable flag', async () => {
    let mintable
    mintable = await NengajoContract.mintable()
    expect(mintable).to.equal(false)

    await expect(NengajoContract.connect(user3).switchMintable()).to.be.revertedWith('Admins only')

    mintable = await NengajoContract.mintable()
    expect(mintable).to.equal(false)
  })
})

describe('check timestamp', () => {
  let NengajoContract: PublicNengajo
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
    const NengajoFactory = (await ethers.getContractFactory('PublicNengajo')) as PublicNengajo__factory
    NengajoContract = await NengajoFactory.deploy(
      'Henkaku Nengajo',
      'HNJ',
      open_blockTimestamp,
      close_blockTimestamp,
      deployer.address
    )
    await NengajoContract.deployed()
  })

  it('check remaining open time', async () => {
    const checkRemainingOpenTime = await NengajoContract.callStatic.checkRemainingOpenTime()
    expect(checkRemainingOpenTime.toNumber()).to.below(4676081)
  })

  it('check remaining close time', async () => {
    const checkRemainingCloseTime = await NengajoContract.callStatic.checkRemainingCloseTime()
    expect(checkRemainingCloseTime.toNumber()).to.below(36212059)
  })
})

describe('after minting term', () => {
  let NengajoContract: PublicNengajo
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
    const NengajoFactory = (await ethers.getContractFactory('PublicNengajo')) as PublicNengajo__factory
    NengajoContract = await NengajoFactory.deploy('Henkaku Nengajo', 'HNJ', 946652400, 946652400, deployer.address)
    await NengajoContract.deployed()
    await NengajoContract.addAdmins([creator.address])
  })

  it('check remaining open time', async () => {
    const checkRemainingOpenTime = await NengajoContract.callStatic.checkRemainingOpenTime()
    expect(checkRemainingOpenTime.toNumber()).to.equal(0)
  })

  it('check remaining close time', async () => {
    const checkRemainingCloseTime = await NengajoContract.callStatic.checkRemainingCloseTime()
    expect(checkRemainingCloseTime.toNumber()).to.equal(0)
  })

  it('failed with minting time', async () => {
    const checkRemainingOpenTime = await NengajoContract.callStatic.checkRemainingOpenTime()

    const checkRemainingCloseTime = await NengajoContract.callStatic.checkRemainingCloseTime()
    await NengajoContract.connect(creator).registerNengajo(1, 'ipfs://test1')
    const tokenURI = await NengajoContract.uri(1)
    expect(tokenURI).equal('ipfs://test1')

    let mintable
    mintable = await NengajoContract.mintable()
    expect(mintable).to.equal(false)

    if (checkRemainingOpenTime || (!checkRemainingCloseTime && !mintable)) {
      await expect(NengajoContract.connect(user1).mint(1)).to.be.revertedWith('Nengajo: Not mintable')
    }
  })
})
