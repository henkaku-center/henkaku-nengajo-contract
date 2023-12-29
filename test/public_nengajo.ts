import { expect } from 'chai'
import { ethers, upgrades } from 'hardhat'
// import {  } from '@openzeppelin/hardhat-upgrades'
import { PublicNengajo, PublicNengajo__factory } from '../typechain-types'
import { Contract, ContractFactory, Signer } from 'ethers'
// import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'

const open_blockTimestamp: number = 1672498800
const close_blockTimestamp: number = 1704034800

describe('RegisterNengajo', () => {
  let NengajoContract: PublicNengajo
  let deployer: Signer
  let creator: Signer
  let user1: Signer
  let user2: Signer
  let user3: Signer

  before(async () => {
    ;[deployer, creator, user1, user2, user3] = await ethers.getSigners()
    const NengajoFactory = (await ethers.getContractFactory('PublicNengajo'))
    NengajoContract = (await upgrades.deployProxy(
      NengajoFactory,
      [
        'Henkaku Nengajo',
        'HNJ',
        open_blockTimestamp,
        close_blockTimestamp,
        await deployer.getAddress()
      ],
      {
        kind: 'uups',
        constructorArgs: [],
        initializer: 'initialize'
      }
    )) as unknown as PublicNengajo
    await NengajoContract.addAdmins([await creator.getAddress()])
  })

  it('initial value', async () => {
    const name = await NengajoContract.name()
    expect(name).equal('Henkaku Nengajo')

    const symbol = await NengajoContract.symbol()
    expect(symbol).equal('HNJ')

    const openTimestamp = await NengajoContract.open_blockTimestamp()
    expect(Number(openTimestamp)).equal(open_blockTimestamp)

    const closeTimestamp = await NengajoContract.close_blockTimestamp()
    expect(Number(closeTimestamp)).equal(close_blockTimestamp)

    const mintable = await NengajoContract.mintable()
    expect(mintable).equal(false)

    const isAdmin = await NengajoContract.isAdmin(await deployer.getAddress())
    expect(isAdmin).equal(true)
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
    expect(getAllRegisteredNengajos[0].creator).to.equal(ethers.ZeroAddress)
    expect(getAllRegisteredNengajos[0].maxSupply).to.equal(0)

    let getRegisteredNengajo
    getRegisteredNengajo = await NengajoContract.retrieveRegisteredNengajo(0)
    expect(getRegisteredNengajo.uri).to.equal('')
    expect(getRegisteredNengajo.creator).to.equal(ethers.ZeroAddress)
    expect(getRegisteredNengajo.maxSupply).to.equal(0)

    // @dev test emit register creative
    await expect(NengajoContract.connect(creator).registerNengajo(2, 'ipfs://test1'))
      .to.emit(NengajoContract, 'RegisterNengajo')
      .withArgs(await creator.getAddress(), 1, 'ipfs://test1', 2)

    tokenURI = await NengajoContract.uri(1)
    expect(tokenURI).equal('ipfs://test1')

    getAllRegisteredNengajos = await NengajoContract.retrieveAllNengajoes()
    expect(getAllRegisteredNengajos.length).to.equal(2)
    expect(getAllRegisteredNengajos[1].uri).to.equal('ipfs://test1')
    expect(getAllRegisteredNengajos[1].creator).to.equal(await creator.getAddress())
    expect(getAllRegisteredNengajos[1].maxSupply).to.equal(2)

    getRegisteredNengajo = await NengajoContract.retrieveRegisteredNengajo(1)
    expect(getRegisteredNengajo.uri).to.equal('ipfs://test1')
    expect(getRegisteredNengajo.creator).to.equal(await creator.getAddress())
    expect(getRegisteredNengajo.maxSupply).to.equal(2)

    const registeredNengajoes = await NengajoContract.retrieveRegisteredNengajoes(await creator.getAddress())
    expect(registeredNengajoes[0].uri).to.equal('ipfs://test1')
    expect(registeredNengajoes[0].creator).to.equal(await creator.getAddress())
    expect(registeredNengajoes[0].maxSupply).to.equal(2)
  })
})

describe('MintNengajo', () => {
  let NengajoContract: PublicNengajo
  let deployer: Signer
  let creator: Signer
  let user1: Signer
  let user2: Signer
  let user3: Signer
  let user4: Signer

  before(async () => {
    ;[deployer, creator, user1, user2, user3, user4] = await ethers.getSigners() as unknown as Signer[]

    const NengajoFactory = (await ethers.getContractFactory('PublicNengajo'))
    NengajoContract = (await upgrades.deployProxy(
      NengajoFactory,
      [
        'Henkaku Nengajo',
        'HNJ',
        open_blockTimestamp,
        close_blockTimestamp,
        await deployer.getAddress()
      ],
      {
        kind: 'uups',
        constructorArgs: [],
        initializer: 'initialize'
      }
    )) as unknown as PublicNengajo
    await NengajoContract.addAdmins([await creator.getAddress()])
    await NengajoContract.connect(creator).registerNengajo(2, 'ipfs://test1')
  })

  it('mint nengajo', async () => {
    await NengajoContract.connect(deployer).switchMintable()

    await NengajoContract.connect(user1).mint(1)
    let balance = await NengajoContract.connect(user1).balanceOf(await user1.getAddress(), 1)
    expect(balance).to.equal(1)

    // @dev test emit mint
    await expect(NengajoContract.connect(user2).mint(1)).to.emit(NengajoContract, 'Mint').withArgs(await user2.getAddress(), 1)

    //await NengajoContract.connect(user2).mint(1)
    balance = await NengajoContract.connect(user2).balanceOf(await user2.getAddress(), 1)
    expect(balance).to.equal(1)
  })

  it('retrieve minted nengajo', async () => {
    // URIs
    let mintedNengajoInfo = await NengajoContract.connect(user1).retrieveMintedNengajoes(await user1.getAddress())
    expect(mintedNengajoInfo.length).equal(1)
    expect(mintedNengajoInfo[0].uri).to.equal('ipfs://test1')
    // Register the second Nengajo
    // ２つ目(_tokenIdが１)の年賀状を登録
    await NengajoContract.connect(creator).registerNengajo(2, 'ipfs://test1')

    // // user1が年賀状を２枚め(_tokenIdが２)をミント
    await NengajoContract.connect(user1).mint(2)
    mintedNengajoInfo = await NengajoContract.connect(user1).retrieveMintedNengajoes(await user1.getAddress())

    expect(mintedNengajoInfo.length).equal(2)
    expect(mintedNengajoInfo[0].id).to.equal(1)
    expect(mintedNengajoInfo[1].id).to.equal(2)
    expect(mintedNengajoInfo[0].uri).to.equal('ipfs://test1')
    expect(mintedNengajoInfo[1].uri).to.equal('ipfs://test1')

    mintedNengajoInfo = await NengajoContract.connect(user2).retrieveMintedNengajoes(await user2.getAddress())

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
      .withArgs(await user3.getAddress(), [3, 4])
    //await NengajoContract.connect(user3).mintBatch([3, 4])

    let balance
    balance = await NengajoContract.connect(user3).balanceOf(await user3.getAddress(), 3)
    expect(balance).to.equal(1)

    balance = await NengajoContract.connect(user3).balanceOf(await user3.getAddress(), 4)
    expect(balance).to.equal(1)

    let mintedNengajoInfo = await NengajoContract.connect(user3).retrieveMintedNengajoes(await user3.getAddress())

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
    balance = await NengajoContract.connect(user3).balanceOf(await user3.getAddress(), 3)
    expect(balance).to.equal(1)

    balance = await NengajoContract.connect(user3).balanceOf(await user3.getAddress(), 4)
    expect(balance).to.equal(1)

    let mintedNengajoInfo = await NengajoContract.connect(user3).retrieveMintedNengajoes(await user3.getAddress())

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
  let deployer: Signer
  let creator: Signer
  let user1: Signer
  let user2: Signer
  let user3: Signer

  before(async () => {
    ;[deployer, creator, user1, user2, user3] = await ethers.getSigners() as unknown as Signer[]

    const NengajoFactory = (await ethers.getContractFactory('PublicNengajo'))
    NengajoContract = (await upgrades.deployProxy(
      NengajoFactory,
      [
        'Henkaku Nengajo',
        'HNJ',
        open_blockTimestamp,
        close_blockTimestamp,
        await deployer.getAddress()
      ],
      {
        kind: 'uups',
        constructorArgs: [],
        initializer: 'initialize'
      }
    )) as unknown as PublicNengajo
  })

  it('initial mintable flag is false', async () => {
    const mintable = await NengajoContract.mintable()
    expect(mintable).to.equal(false)
  })

  it('initial admin is deployer', async () => {
    const admin = await NengajoContract.isAdmin(await deployer.getAddress())
    expect(admin).to.equal(true)
  })

  it('initial admin is only deployer', async () => {
    const admin = await NengajoContract.isAdmin(await user1.getAddress())
    expect(admin).to.equal(false)
  })

  it('only admins can add new admins', async () => {
    const newAdmins = [await user1.getAddress(), await user2.getAddress()]
    await expect(NengajoContract.connect(creator).addAdmins(newAdmins)).to.be.revertedWith('Admins only')
  })

  it('add a new admin', async () => {
    const newAdmins = [await creator.getAddress()]

    let isAdmin
    isAdmin = await NengajoContract.isAdmin(await creator.getAddress())
    expect(isAdmin).to.equal(false)

    const addAdminsTx = await NengajoContract.connect(deployer).addAdmins(newAdmins);
    await addAdminsTx.wait();
    
    isAdmin = await NengajoContract.isAdmin(await creator.getAddress());

    isAdmin = await NengajoContract.isAdmin(await creator.getAddress())
    expect(isAdmin).to.equal(true)
  })

  it('add new admins', async () => {
    const newAdmins = [await user1.getAddress(), await user2.getAddress()]

    let isAdmin
    isAdmin = await NengajoContract.isAdmin(await user1.getAddress())
    expect(isAdmin).to.equal(false)
    isAdmin = await NengajoContract.isAdmin(await user2.getAddress())
    expect(isAdmin).to.equal(false)

    const addAdmins = await NengajoContract.connect(deployer).addAdmins(newAdmins)
    await addAdmins.wait()

    isAdmin = await NengajoContract.isAdmin(await user1.getAddress())
    expect(isAdmin).to.equal(true)
    isAdmin = await NengajoContract.isAdmin(await user2.getAddress())
    expect(isAdmin).to.equal(true)
  })

  it('delete an admin', async () => {
    let isAdmin
    isAdmin = await NengajoContract.isAdmin(await user2.getAddress())
    expect(isAdmin).to.equal(true)

    const deleteAdmin = await NengajoContract.connect(deployer).deleteAdmin(await user2.getAddress())
    await deleteAdmin.wait()

    isAdmin = await NengajoContract.isAdmin(await user2.getAddress())
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
  let deployer: Signer
  let creator: Signer
  let user1: Signer
  let user2: Signer

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
    ;[deployer, creator, user1, user2] = await ethers.getSigners() as unknown as Signer[]

    const NengajoFactory = (await ethers.getContractFactory('PublicNengajo'))
    NengajoContract = (await upgrades.deployProxy(
      NengajoFactory,
      [
        'Henkaku Nengajo',
        'HNJ',
        open_blockTimestamp,
        close_blockTimestamp,
        await deployer.getAddress()
      ],
      {
        kind: 'uups',
        constructorArgs: [],
        initializer: 'initialize'
      }
    )) as unknown as PublicNengajo
  })

  it('check remaining open time', async () => {
    const checkRemainingOpenTime = await NengajoContract.checkRemainingOpenTime()
    expect(Number(checkRemainingOpenTime)).to.below(4676081)
  })

  it('check remaining close time', async () => {
    const checkRemainingCloseTime = await NengajoContract.checkRemainingCloseTime()
    expect(Number(checkRemainingCloseTime)).to.below(36212059)
  })
})

describe('after minting term', () => {
  let NengajoContract: PublicNengajo
  let deployer: Signer
  let creator: Signer
  let user1: Signer
  let user2: Signer

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
    ;[deployer, creator, user1, user2] = await ethers.getSigners() as unknown as Signer[]

    const NengajoFactory = (await ethers.getContractFactory('PublicNengajo'))
    NengajoContract = (await upgrades.deployProxy(
      NengajoFactory,
      [
        'Henkaku Nengajo',
        'HNJ',
        open_blockTimestamp,
        close_blockTimestamp,
        await deployer.getAddress()
      ],
      {
        kind: 'uups',
        constructorArgs: [],
        initializer: 'initialize'
      }
    )) as unknown as PublicNengajo
    await NengajoContract.addAdmins([await creator.getAddress()])
  })

  it('check remaining open time', async () => {
    const checkRemainingOpenTime = await NengajoContract.checkRemainingOpenTime()
    expect(Number(checkRemainingOpenTime)).to.equal(0)
  })

  // it('check remaining close time', async () => {
  //   const checkRemainingCloseTime = await NengajoContract.checkRemainingCloseTime()
  //   expect(Number(checkRemainingCloseTime)).to.equal(0)
  // })

  it('failed with minting time', async () => {
    const checkRemainingOpenTime = await NengajoContract.checkRemainingOpenTime()

    const checkRemainingCloseTime = await NengajoContract.checkRemainingCloseTime()
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
