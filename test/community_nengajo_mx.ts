import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ethers as hardhatEthers } from 'hardhat'
import { BigNumber, ethers } from 'ethers'
import { HenkakuToken, HenkakuToken__factory,Forwarder, Forwarder__factory, Nengajo, Nengajo__factory } from '../typechain-types'
import ethSignUtil from 'eth-sig-util'
import { expect } from 'chai'

const open_blockTimestamp: number = 0
const close_blockTimestamp: number = 2704034800

const deployAndDistributeHenkakuV2: (params: {
  deployer: SignerWithAddress
  addresses: string[]
  amount: BigNumber
}) => Promise<HenkakuToken> = async ({ deployer, addresses, amount }) => {
  const HenkakuV2Factory = (await hardhatEthers.getContractFactory('HenkakuToken')) as HenkakuToken__factory
  const HenkakuV2Contract = await HenkakuV2Factory.connect(deployer).deploy()
  await HenkakuV2Contract.deployed()

  await HenkakuV2Contract.addWhitelistUsers(addresses)

  for (const address of addresses) {
    await HenkakuV2Contract.mint(address, amount)
  }

  return HenkakuV2Contract
}

describe('Mint via Fowarder', () => {
  let NengajoContract: Nengajo
  let HenkakuTokenContract: HenkakuToken
  let ForwarderContract: Forwarder
  let deployer: SignerWithAddress
  let creator: SignerWithAddress
  let user1: SignerWithAddress

  before(async () => {
    ;[deployer, creator, user1] = await hardhatEthers.getSigners()
    HenkakuTokenContract = await deployAndDistributeHenkakuV2({
      deployer,
      addresses: [deployer.address, creator.address, user1.address],
      amount: ethers.utils.parseEther('1000'),
    })
    const ForwarderFactory = (await hardhatEthers.getContractFactory('Forwarder')) as Forwarder__factory
    ForwarderContract = await ForwarderFactory.connect(deployer).deploy()
    await ForwarderContract.deployed()
    const NengajoFactory = (await hardhatEthers.getContractFactory('Nengajo')) as Nengajo__factory
    NengajoContract = await NengajoFactory.connect(deployer).deploy(
      'Henkaku Nengajo',
      'HNJ',
      open_blockTimestamp,
      close_blockTimestamp,
      HenkakuTokenContract.address,
      deployer.address,
      ForwarderContract.address
    )
    await NengajoContract.deployed()

    await HenkakuTokenContract.connect(deployer).approve(NengajoContract.address, ethers.utils.parseEther('1000'))

    await HenkakuTokenContract.connect(creator).approve(NengajoContract.address, ethers.utils.parseEther('1000'))

    await HenkakuTokenContract.connect(user1).approve(NengajoContract.address, ethers.utils.parseEther('1000'))

    await ForwarderContract.whitelistTarget(NengajoContract.address, true)
    const x = NengajoContract.interface.encodeFunctionData('mint', [1]).substring(0, 10)
    await ForwarderContract.whitelistMethod(NengajoContract.address, x, true)

    await NengajoContract.addAdmins([creator.address])
    await NengajoContract.connect(creator).registerNengajo(100, 'https://test.com')
  })

  it('mint Nengajo', async () => {
    const from = user1.address
    const data = NengajoContract.interface.encodeFunctionData('mint', [1])
    const to = NengajoContract.address

    const { request, signature } = await signMetaTxRequest(user1.provider, ForwarderContract, {
      to,
      from,
      data,
    })

    await ForwarderContract.execute(request, signature)

    const balance = await NengajoContract.balanceOf(user1.address, 1)
    expect(balance.toNumber()).to.equal(1)
  })

  it('tx fail when execute not allowed target', async () => {
    const from = user1.address
    const data = NengajoContract.interface.encodeFunctionData('mint', [[1]])

    const { request, signature } = await signMetaTxRequest(user1.provider, ForwarderContract, {
      to: '0xcbEAF3BDe82155F56486Fb5a1072cb8baAf547cc',
      from,
      data,
    })

    await expect(ForwarderContract.execute(request, signature)).to.be.rejectedWith(
      'Forwarder: signature does not match request'
    )
  })

  it('tx fail when execute not allowed method', async () => {
    const from = user1.address
    const data = NengajoContract.interface.encodeFunctionData('mintBatch', [[1]])
    const to = NengajoContract.address

    const { request, signature } = await signMetaTxRequest(user1.provider, ForwarderContract, {
      to,
      from,
      data,
    })

    await expect(ForwarderContract.execute(request, signature)).to.be.rejectedWith(
      'Forwarder: signature does not match request'
    )
  })
})

const EIP712Domain = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
  { name: 'chainId', type: 'uint256' },
  { name: 'verifyingContract', type: 'address' },
]

// forwarder request struct
// ref: lib/openzeppelin-contracts/contracts/metatx/MinimalForwarder.sol
const ForwardRequest = [
  { name: 'from', type: 'address' },
  { name: 'to', type: 'address' },
  { name: 'value', type: 'uint256' },
  { name: 'gas', type: 'uint256' },
  { name: 'nonce', type: 'uint256' },
  { name: 'data', type: 'bytes' },
]

const getMetaTxTypeData = (chainId: number, verifyingContract: string) => {
  // Specification of the eth_signTypedData JSON RPC
  return {
    types: {
      EIP712Domain,
      ForwardRequest,
    },
    domain: {
      name: 'Forwarder',
      version: '0.0.1',
      chainId,
      verifyingContract,
    },
    primaryType: 'ForwardRequest',
  }
}

const signTypeData = async (signer: any, from: string, data: any) => {
  if (typeof signer === 'string') {
    const privateKey = Buffer.from(signer.replace(/^0x/, ''), 'hex')
    return ethSignUtil.signTypedMessage(privateKey, { data })
  }

  const [method, argData] = ['eth_signTypedData_v4', JSON.stringify(data)]
  return await signer.send(method, [from, argData])
}

export const buildRequest = async (forwarder: ethers.Contract, input: any) => {
  const nonce = await forwarder.getNonce(input.from).then((nonce: { toString: () => any }) => nonce.toString())
  return { value: 0, gas: 1e6, nonce, ...input }
}

export const buildTypedData = async (forwarder: ethers.Contract, request: any) => {
  const chainId = await forwarder.provider.getNetwork().then((n) => n.chainId)
  const typeData = getMetaTxTypeData(chainId, forwarder.address)
  return { ...typeData, message: request }
}

export const signMetaTxRequest = async (signer: any, forwarder: ethers.Contract, input: any) => {
  const request = await buildRequest(forwarder, input)
  const toSign = await buildTypedData(forwarder, request)
  const signature = await signTypeData(signer, input.from, toSign)
  return { signature, request }
}
