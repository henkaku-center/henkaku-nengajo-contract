// import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ethers as hardhatEthers, upgrades } from 'hardhat'
import { Signer, ethers } from 'ethers'
import { Forwarder, Forwarder__factory, PublicNengajo, PublicNengajo__factory } from '../typechain-types'
import ethSignUtil from 'eth-sig-util'
import { expect } from 'chai'
import { HardhatEthersHelpers } from '@nomicfoundation/hardhat-ethers/types'

const open_blockTimestamp: number = 0
const close_blockTimestamp: number = 2704034800

describe('Mint via Fowarder', () => {
  let NengajoContract: PublicNengajo
  let ForwarderContract: Forwarder
  let deployer: Signer
  let creator: Signer
  let user1: Signer

  before(async () => {
    ;[deployer, creator, user1] = await hardhatEthers.getSigners()
    const ForwarderFactory = await hardhatEthers.getContractFactory('Forwarder')
    ForwarderContract = await ForwarderFactory.deploy() as unknown as Forwarder
    await ForwarderContract.waitForDeployment()

    const NengajoFactory = (await hardhatEthers.getContractFactory('PublicNengajo'))
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

    await ForwarderContract.whitelistTarget(await NengajoContract.getAddress(), true)
    const x = NengajoContract.interface.encodeFunctionData('mint', [1]).substring(0, 10)
    await ForwarderContract.whitelistMethod(await NengajoContract.getAddress(), x, true)

    await NengajoContract.addAdmins([await creator.getAddress()])
    await NengajoContract.connect(creator).registerNengajo(100, 'https://test.com')
  })

  it('mint Nengajo', async () => {
    const from = await user1.getAddress()
    const data = NengajoContract.interface.encodeFunctionData('mint', [1])
    const to = await NengajoContract.getAddress()

    const { request, signature } = await signMetaTxRequest(user1.provider, ForwarderContract, {
      to,
      from,
      data,
    })

    await ForwarderContract.execute(request, signature)

    const balance = await NengajoContract.balanceOf(await user1.getAddress(), 1)
    expect(Number(balance)).to.equal(1)
  })

  it('tx fail when execute not allowed target', async () => {
    const from = await user1.getAddress()
    const data = NengajoContract.interface.encodeFunctionData('mint', [1])

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
    const from = await user1.getAddress()
    const data = NengajoContract.interface.encodeFunctionData('mintBatch', [[1]])
    const to = await NengajoContract.getAddress()

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
  const chainId = await forwarder.getNetwork().then((n) => n.chainId)
  const typeData = getMetaTxTypeData(chainId, await forwarder.getAddress())
  return { ...typeData, message: request }
}

export const signMetaTxRequest = async (signer: any, forwarder: ethers.Contract, input: any) => {
  const request = await buildRequest(forwarder, input)
  const toSign = await buildTypedData(forwarder, request)
  const signature = await signTypeData(signer, input.from, toSign)
  return { signature, request }
}
