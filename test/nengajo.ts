import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { ethers } from 'hardhat'
import { HenkakuToken, Nengajo } from '../typechain-types'

const open_blockTimestamp: number = 1672498800
const close_blockTimestamp: number = 1704034800

const deployAndDistributeHenkakuV2: (params: {
  deployer: SignerWithAddress
  addresses: string[]
}) => Promise<HenkakuToken> = async ({ deployer, addresses }) => {
  const HenkakuV2Factory = await ethers.getContractFactory('HenkakuToken')
  const HenkakuV2Contract = await HenkakuV2Factory.connect(deployer).deploy()
  await HenkakuV2Contract.deployed()

  await HenkakuV2Contract.addWhitelistUsers(addresses)

  for (const address of addresses) {
    await HenkakuV2Contract.mint(address, 100)
  }

  return HenkakuV2Contract
}

describe('CreateNengajo', () => {
  let NengajoContract: Nengajo
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
    })
    const NengajoFactory = await ethers.getContractFactory('Nengajo')
    NengajoContract = await NengajoFactory.deploy(
      'Henkaku Nengajo',
      'HNJ',
      open_blockTimestamp,
      close_blockTimestamp,
      HenkakuTokenContract.address,
      deployer.address
    )
    await NengajoContract.deployed()
  })

  it('register creative', async () => {
    await HenkakuTokenContract.connect(creator).approve(NengajoContract.address, 200)
    // Register the first Nengajo
    // １つ目の年賀状(_tokenIdが０)を登録
    await NengajoContract.connect(creator).registerCreative(2, 'ipfs://test1')
    const tokenURI = await NengajoContract.uri(0)
    expect(tokenURI).equal('ipfs://test1')

    const getAllregisteredNengajoes = await NengajoContract.getAllregisteredNengajoes()
    expect(getAllregisteredNengajoes.length).to.equal(1)
    expect(getAllregisteredNengajoes[0].uri).to.equal('ipfs://test1')
    expect(getAllregisteredNengajoes[0].creator).to.equal(creator.address)
    expect(getAllregisteredNengajoes[0].maxSupply).to.equal(2)

    const getRegisteredNengajo = await NengajoContract.getRegisteredNengajo(0)
    expect(getRegisteredNengajo.uri).to.equal('ipfs://test1')
    expect(getRegisteredNengajo.creator).to.equal(creator.address)
    expect(getRegisteredNengajo.maxSupply).to.equal(2)
    const registeredNengajoes = await NengajoContract.retriveRegisteredNengajoes(creator.address)
    expect(registeredNengajoes[0].uri).to.equal('ipfs://test1')
    expect(registeredNengajoes[0].creator).to.equal(creator.address)
    expect(registeredNengajoes[0].maxSupply).to.equal(2)
  })

  it('failed register creative with insufficient henkaku token', async () => {
    // Nengajo registration is reverted.
    // 年賀状の登録がリバートされる
    await expect(NengajoContract.connect(creator).registerCreative(1000, 'ipfs://test1')).to.be.revertedWith(
      'Nengajo: Insufficient HenkakuV2 token'
    )
  })

  it('mint nengajo', async () => {
    await NengajoContract.connect(deployer).switchMintable()

    await NengajoContract.connect(user1).mint(0)
    let balance = await NengajoContract.connect(user1).balanceOf(user1.address, 0)
    expect(balance).to.equal(1)

    await NengajoContract.connect(user2).mint(0)
    balance = await NengajoContract.connect(user2).balanceOf(user2.address, 0)
    expect(balance).to.equal(1)
  })

  it('retrieve minted nengajo', async () => {
    // ミントされた年賀状の確認
    let mintedNengajo = await NengajoContract.connect(user1).retrieveMintedNengajoIds()
    expect(mintedNengajo.length).equal(1)
    expect(mintedNengajo[0]).to.equal(0)
    // URIs
    let mintedNengajoURI = await NengajoContract.connect(user1).retrieveMintedNengajoURIs()
    expect(mintedNengajoURI.length).equal(1)
    expect(mintedNengajoURI[0]).to.equal('ipfs://test1')
    // Register the second Nengajo
    // ２つ目(_tokenIdが１)の年賀状を登録
    await NengajoContract.connect(creator).registerCreative(2, 'ipfs://test1')

    // user1が年賀状を２枚め(_tokenIdが１)をミント
    await NengajoContract.connect(user1).mint(1)
    mintedNengajo = await NengajoContract.connect(user1).retrieveMintedNengajoIds()

    expect(mintedNengajo.length).equal(2)
    expect(mintedNengajo[0]).to.equal(0)
    expect(mintedNengajo[1]).to.equal(1)
    //URIs
    mintedNengajoURI = await NengajoContract.connect(user1).retrieveMintedNengajoURIs()

    expect(mintedNengajoURI.length).equal(2)
    expect(mintedNengajoURI[0]).to.equal('ipfs://test1')
    expect(mintedNengajoURI[1]).to.equal('ipfs://test1')

    mintedNengajo = await NengajoContract.connect(user2).retrieveMintedNengajoIds()

    expect(mintedNengajo.length).equal(1)
    expect(mintedNengajo[0]).to.equal(0)
    //URIs
    mintedNengajoURI = await NengajoContract.connect(user2).retrieveMintedNengajoURIs()

    expect(mintedNengajoURI.length).equal(1)
    expect(mintedNengajoURI[0]).to.equal('ipfs://test1')
  })

  it('mint batch nengajos', async () => {
    // Register the third Nengajo
    // ３つ目(_tokenIdが２)の年賀状を登録
    await NengajoContract.connect(creator).registerCreative(2, 'ipfs://test4')

    // Register the fourth Nengajo
    // 4つ目(_tokenIdが３)の年賀状を登録
    await NengajoContract.connect(creator).registerCreative(2, 'ipfs://test4')

    await NengajoContract.connect(user3).mintBatch([2, 3])

    let balance
    balance = await NengajoContract.connect(user3).balanceOf(user3.address, 2)
    expect(balance).to.equal(1)

    balance = await NengajoContract.connect(user3).balanceOf(user3.address, 3)
    expect(balance).to.equal(1)

    let mintedNengajo = await NengajoContract.connect(user3).retrieveMintedNengajoIds()

    expect(mintedNengajo.length).equal(2)
    expect(mintedNengajo[0]).to.equal(2)
    expect(mintedNengajo[1]).to.equal(3)
    //URIs
    let mintedNengajoURI = await NengajoContract.connect(user3).retrieveMintedNengajoURIs()

    expect(mintedNengajoURI.length).equal(2)
    expect(mintedNengajoURI[0]).to.equal('ipfs://test4')
    expect(mintedNengajoURI[1]).to.equal('ipfs://test4')
  })

  it('mint batch failed with already have', async () => {
    // Confirmed that even with the mintBatch function, it is not possible to mint more than two Nengajos.
    // mintBatch関数でも同じ年賀状を2つ以上ミント出来ないことを確認
    await expect(NengajoContract.connect(user3).mintBatch([2, 3])).to.be.revertedWith(
      'Nengajo: You already have this nengajo'
    )

    // Confirm that balance, etc. has not changed.
    // balance等が変わっていないことを確認
    let balance
    balance = await NengajoContract.connect(user3).balanceOf(user3.address, 2)
    expect(balance).to.equal(1)

    balance = await NengajoContract.connect(user3).balanceOf(user3.address, 3)
    expect(balance).to.equal(1)

    let mintedNengajo = await NengajoContract.connect(user3).retrieveMintedNengajoIds()

    expect(mintedNengajo.length).equal(2)
    expect(mintedNengajo[0]).to.equal(2)
    expect(mintedNengajo[1]).to.equal(3)
    //URIs
    let mintedNengajoURI = await NengajoContract.connect(user3).retrieveMintedNengajoURIs()

    expect(mintedNengajoURI.length).equal(2)
    expect(mintedNengajoURI[0]).to.equal('ipfs://test4')
    expect(mintedNengajoURI[1]).to.equal('ipfs://test4')
  })

  it('failed with unavailable', async () => {
    // await expect(NengajoContract.connect(user2).mint(1)).to.be.revertedWith('Nengajo: not available')
    await expect(NengajoContract.connect(user2).mint(999)).to.be.revertedWith('Nengajo: not available')
  })

  it('failed with already have', async () => {
    await expect(NengajoContract.connect(user2).mint(0)).to.be.revertedWith('Nengajo: You already have this nengajo')
  })

  it('failed with mint limit', async () => {
    await expect(NengajoContract.connect(user3).mint(0)).to.be.revertedWith('Nengajo: Mint limit reached')
  })

  it('failed with insufficient Henkaku Token', async () => {
    await expect(NengajoContract.connect(user4).mint(1)).to.be.revertedWith(
      'Nengajo: Insufficient Henkaku Token Balance'
    )
  })
})

describe('CheckMintable', () => {
  let NengajoContract: Nengajo
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
    })
    const NengajoFactory = await ethers.getContractFactory('Nengajo')
    NengajoContract = await NengajoFactory.deploy(
      'Henkaku Nengajo',
      'HNJ',
      open_blockTimestamp,
      close_blockTimestamp,
      HenkakuTokenContract.address,
      deployer.address
    )
    await NengajoContract.deployed()
    HenkakuTokenContract = await deployAndDistributeHenkakuV2({
      deployer,
      addresses: [creator.address, user1.address, user2.address],
    })
  })

  it('initial mintable flag is false', async () => {
    const mintable = await NengajoContract.mintable()
    expect(mintable).to.equal(false)
  })

  it('initial admin is deployer', async () => {
    const admin = await NengajoContract.admins(deployer.address)
    expect(admin).to.equal(true)
  })

  it('initial admin is only deployer', async () => {
    const admin = await NengajoContract.admins(user1.address)
    expect(admin).to.equal(false)
  })

  it('only admins can add new admins', async () => {
    const newAdmins = [user1.address, user2.address]
    await expect(NengajoContract.connect(creator).addAdmins(newAdmins)).to.be.revertedWith('Admins only')
  })

  it('add a new admin', async () => {
    const newAdmins = [creator.address]

    let isAdmin
    isAdmin = await NengajoContract.admins(creator.address)
    expect(isAdmin).to.equal(false)

    const addAdmins = await NengajoContract.connect(deployer).addAdmins(newAdmins)
    await addAdmins.wait()

    isAdmin = await NengajoContract.admins(creator.address)
    expect(isAdmin).to.equal(true)
  })

  it('add new admins', async () => {
    const newAdmins = [user1.address, user2.address]

    let isAdmin
    isAdmin = await NengajoContract.admins(user1.address)
    expect(isAdmin).to.equal(false)
    isAdmin = await NengajoContract.admins(user2.address)
    expect(isAdmin).to.equal(false)

    const addAdmins = await NengajoContract.connect(deployer).addAdmins(newAdmins)
    await addAdmins.wait()

    isAdmin = await NengajoContract.admins(user1.address)
    expect(isAdmin).to.equal(true)
    isAdmin = await NengajoContract.admins(user2.address)
    expect(isAdmin).to.equal(true)
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
  let NengajoContract: Nengajo
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
    })
    const NengajoFactory = await ethers.getContractFactory('Nengajo')
    NengajoContract = await NengajoFactory.deploy(
      'Henkaku Nengajo',
      'HNJ',
      open_blockTimestamp,
      close_blockTimestamp,
      HenkakuTokenContract.address,
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
  let NengajoContract: Nengajo
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
    })
    const NengajoFactory = await ethers.getContractFactory('Nengajo')
    NengajoContract = await NengajoFactory.deploy(
      'Henkaku Nengajo',
      'HNJ',
      946652400,
      946652400,
      HenkakuTokenContract.address,
      deployer.address
    )
    await NengajoContract.deployed()
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
    await HenkakuTokenContract.connect(creator).approve(NengajoContract.address, 200)
    await NengajoContract.connect(creator).registerCreative(1, 'ipfs://test1')
    const tokenURI = await NengajoContract.uri(0)
    expect(tokenURI).equal('ipfs://test1')

    let mintable
    mintable = await NengajoContract.mintable()
    expect(mintable).to.equal(false)

    if (checkRemainingOpenTime || (!checkRemainingCloseTime && !mintable)) {
      await expect(NengajoContract.connect(user1).mint(0)).to.be.revertedWith('Nengajo: Not mintable')
    }
  })
})
