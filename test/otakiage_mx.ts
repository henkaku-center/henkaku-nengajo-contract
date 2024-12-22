import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers'
import { ethers as hardhatEthers } from 'hardhat'
import { ethers } from 'ethers'
import { Forwarder, Omamori, Otakiage } from '../typechain-types'
import ethSignUtil from 'eth-sig-util'
import { expect } from 'chai'
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { getOmamoriMetaDataURL, omamoriTokenIdOffset, omamoriTypeCount, setUpOmamoriForTestEnv } from '../scripts/utils/setUpOmamoriForTestEnv'
import { deployAndSetupOtakiage } from '../scripts/utils/deployAndSetupOtakiage'
import { allowApprovedMtxToOmamori } from '../scripts/utils/allowApprovedMtxToOmamori'
import { addNewAdminToPastYearContracts } from '../scripts/utils/addNewAdminToPastYearContracts'
import { setOtakiageCid, TEST_CID, TEST_IMAGE_EXTENSION } from '../scripts/utils/setOtakiageCid'
import { mintOmamorisForTestEnv } from '../scripts/utils/mintOmamorisForTestEnv'
import { Contract } from "ethers";

const open_blockTimestamp: number = 0
const close_blockTimestamp: number = 2704034800

  describe('Otakiage Test', () => {
  let OmamoriContract: Omamori
  let OtakiageContract: Otakiage
  let ForwarderContract: Forwarder
  let deployer: SignerWithAddress
  let creator: SignerWithAddress
  let user1: SignerWithAddress
  let user2: SignerWithAddress

  before(async () => {
    ;[deployer, creator, user1, user2] = await hardhatEthers.getSigners()
    const setup = await setUpOmamoriForTestEnv(open_blockTimestamp, close_blockTimestamp)
    OmamoriContract = setup.OmamoriContract
    ForwarderContract = setup.ForwarderContract

    await mintOmamorisForTestEnv(OmamoriContract, user1, user2)
  })

  describe('Past Year Part', () => {
    describe("Check past year part", () => {
      describe('check setup omamori vars', () => {
        it('check OmamoriContract.address', async () => {
          expect(await OmamoriContract.getAddress()).to.not.be.undefined
        })
        
        it('check ForwarderContract.address', async () => {
          expect(await ForwarderContract.getAddress()).to.not.be.undefined
        })
    
        it('check user1 balances', async () => {
          for (let i = 0; i < omamoriTokenIdOffset; i++) {
            expect(await OmamoriContract.balanceOf(user1.address, i)).to.equal(0)
          }
          
          for (let i = 0; i < omamoriTypeCount; i++) {
            expect(await OmamoriContract.balanceOf(user1.address, i + omamoriTokenIdOffset)).to.equal(1)
          }

          await expect(
            OmamoriContract.balanceOf(user1.address, omamoriTypeCount + omamoriTokenIdOffset)
          ).to.be.revertedWithoutReason;
        })
    
        it('check user2 balances', async () => {
          expect(await OmamoriContract.balanceOf(user2.address, 0 + omamoriTokenIdOffset)).to.equal(1)
        })
      })
    })
  })

  describe('This Year Part', () => {
    describe('Before Otakiage event day', () => {
      describe('Admin preparations', () => {
        describe('add admin of this year to Omamori and Forwarder', () => {
          it('add admin of this year to past year contracts', async () => {
            await addNewAdminToPastYearContracts(deployer.address, OmamoriContract, ForwarderContract)
          })

          it('check admin of this year', async () => {
            expect(await OmamoriContract.isAdmin(deployer.address)).to.be.true
            expect(await ForwarderContract.isAdmin(deployer.address)).to.be.true
          })
        })
        
        describe('deploy otakiage', () => {
          it('deploy otakiage', async () => {
            const result = await deployAndSetupOtakiage(ForwarderContract, OmamoriContract)
            OtakiageContract = result.OtakiageContract
            expect(await OtakiageContract.getAddress()).to.not.be.undefined
          })

          it('check omamoriTypeCount', async () => {
            expect(await OtakiageContract.omamoriTypeCount()).to.equal(omamoriTypeCount)
          })

          it('check omamoriTokenIdOffset', async () => {
            expect(await OtakiageContract.omamoriTokenIdOffset()).to.equal(omamoriTokenIdOffset)
          })

          it('check imageExtension', async () => {
            expect(await OtakiageContract.imageExtension()).to.equal(TEST_IMAGE_EXTENSION)
          })
        })

        describe('set ipfs cid', () => {
          it('set ipfs cid', async () => {
            await setOtakiageCid(OtakiageContract, TEST_CID)
          })

          it('check cid', async () => {
            expect(await OtakiageContract.cid()).to.equal(TEST_CID)
          })

          it('getImage', async () => {
            expect(await OtakiageContract.getImage(0)).to.equal(`ipfs://${TEST_CID}/0${TEST_IMAGE_EXTENSION}`)
          })
        })

        describe('allow approved with mtx to Omamori', () => {
          it('add setApprovedForAll to whitelist method of Forwarder', async () => {
            await allowApprovedMtxToOmamori(OmamoriContract, ForwarderContract, OtakiageContract)
          })
        })
      })
      
      describe('User preparations', () => {
        describe('setApprovalForAll omamori', () => {
          it('approve omamori by user1 with mtx', async () => {      
            const from = user1.address
            const data = OmamoriContract.interface.encodeFunctionData('setApprovalForAll', [await OtakiageContract.getAddress(), true])
            const to = await OmamoriContract.getAddress()
    
            const { request, signature } = await signMetaTxRequest(
              user1.provider, 
              ForwarderContract as unknown as Contract, 
              {
                to,
                from,
                data,
              }
            )
    
            await ForwarderContract.execute(request, signature)
          })
    
          it('check approval for all by user1', async () => {
            expect(await OmamoriContract.isApprovedForAll(user1.address, await OtakiageContract.getAddress())).to.be.true
          })
    
          it('approve omamori by user2', async () => {
            await OmamoriContract.connect(user2).setApprovalForAll(await OtakiageContract.getAddress(), true)
          })
    
          it('check approval for all by user2', async () => {
            expect(await OmamoriContract.isApprovedForAll(user2.address, await OtakiageContract.getAddress())).to.be.true
          })
        })
    
        describe('sendAllOmamori to otakiage', () => {
          it('check otakiageUsersArr before sendAllOmamori', async () => {
            const usersArr = await OtakiageContract.getOtakiageUsersArr()
            expect(usersArr).to.deep.equal([])

            const usersArr2 = await OtakiageContract.getOtakiageUsersArr()
            expect(usersArr2).to.deep.equal([])
          })
    
          it('check otakiageUserCount before sendAllOmamori', async () => {
            const userCount = await OtakiageContract.getOtakiageUserCount()
            expect(userCount).to.equal(0)
          })

          it('check otakiageUserOmamoriIds before sendAllOmamori', async () => {
            const userOmamoriIds = await OtakiageContract.getOtakiageUserOmamoriIds(user1.address)
            expect(userOmamoriIds).to.deep.equal([])

            const userOmamoriIds2 = await OtakiageContract.getOtakiageUserOmamoriIds(user2.address)
            expect(userOmamoriIds2).to.deep.equal([])
          })

          it('check otakiageUserOmamoriIdsCount before sendAllOmamori', async () => {
            const userOmamoriIdsCount = await OtakiageContract.getOtakiageUserOmamoriIdsCount(user1.address)
            expect(userOmamoriIdsCount).to.equal(0)

            const userOmamoriIdsCount2 = await OtakiageContract.getOtakiageUserOmamoriIdsCount(user2.address)
            expect(userOmamoriIdsCount2).to.equal(0)
          })
    
          it('check balance of omamori of user1', async () => {
            for (let i = 0; i < omamoriTypeCount; i++) {
              expect(await OmamoriContract.balanceOf(user1.address, i + omamoriTokenIdOffset)).to.equal(1)
            }
          })
    
          it('sendAllOmamori by user1', async () => {
            const from = user1.address
            const data = OtakiageContract.interface.encodeFunctionData('sendAllOmamori')
            const to = await OtakiageContract.getAddress()
    
            const { request, signature } = await signMetaTxRequest(
              user1.provider, 
              ForwarderContract as unknown as Contract, 
              {
                to,
                from,
                data,
              }
            )
    
            await ForwarderContract.execute(request, signature)
          })
    
          it('check balance of omamori of user1', async () => {
            for (let i = 0; i < omamoriTypeCount; i++) {
              expect(await OmamoriContract.balanceOf(user1.address, i + omamoriTokenIdOffset)).to.equal(0)
            }
          })
    
          it('check balance of omamori of user2', async () => {
            expect(await OmamoriContract.balanceOf(user2.address, 0 + omamoriTokenIdOffset)).to.equal(1)
          })
          
          it('sendAllOmamori by user2', async () => {
            const from = user2.address
            const data = OtakiageContract.interface.encodeFunctionData('sendAllOmamori')
            const to = await OtakiageContract.getAddress()
    
            const { request, signature } = await signMetaTxRequest(
              user2.provider, 
              ForwarderContract as unknown as Contract, 
              {
                to,
                from,
                data,
              }
            )
    
            await ForwarderContract.execute(request, signature)
          })
    
          it('check balance of omamori of user2', async () => {
            expect(await OmamoriContract.balanceOf(user2.address, omamoriTokenIdOffset)).to.equal(0)
          })
    
          it('check otakiageUsersArr after sendAllOmamori', async () => {
            const usersArr = await OtakiageContract.getOtakiageUsersArr()
            expect(usersArr).to.deep.equal([user1.address, user2.address])
          })
    
          it('check otakiageUserCount after sendAllOmamori', async () => {
            const userCount = await OtakiageContract.getOtakiageUserCount()
            expect(userCount).to.equal(2)
          })

          it('check otakiageUserOmamoriIds after sendAllOmamori', async () => {
            const userOmamoriIds = await OtakiageContract.getOtakiageUserOmamoriIds(user1.address)
            expect(userOmamoriIds).to.deep.equal([1, 2, 3, 4, 5, 6,])

            const userOmamoriIds2 = await OtakiageContract.getOtakiageUserOmamoriIds(user2.address)
            expect(userOmamoriIds2).to.deep.equal([1])
          })

          it('check otakiageUserOmamoriIdsCount after sendAllOmamori', async () => {
            const userOmamoriIdsCount = await OtakiageContract.getOtakiageUserOmamoriIdsCount(user1.address)
            expect(userOmamoriIdsCount).to.equal(6)

            const userOmamoriIdsCount2 = await OtakiageContract.getOtakiageUserOmamoriIdsCount(user2.address)
            expect(userOmamoriIdsCount2).to.equal(1)
          })
        })
      })
    })

    describe('Otakiage event day', () => {
      describe('otakiage', () => {
        it('check otakiage tokenIds before otakiage', async () => {
          expect(await OtakiageContract.tokenIds()).to.equal(0)
        })
  
        it('otakiage', async () => {
          await OtakiageContract.otakiage()
        })
  
        it('check otakiage tokenIds after otakiage', async () => {
          expect(await OtakiageContract.tokenIds()).not.to.equal(0)
        })

        describe('check ownerOf', () => {
          // OtakiageNFTは、IDが0から始まり、OmamoriNFTの枚数に関わらず一人一枚
          it('check id 0', async () => {
            expect(await OtakiageContract.ownerOf(0)).to.equal(user1.address)
          })

          it('check id 1', async () => {
            expect(await OtakiageContract.ownerOf(1)).to.equal(user2.address)
          })
        })
      })
    })

    describe('After Otakiage event day', () => {
      describe('check omamoriNFTs in OtakiageContract', () => {
        it('check balanceOfBatch', async () => {
          const accounts = Array(6).fill(await OtakiageContract.getAddress())
          const ids = Array.from({ length: omamoriTypeCount }, (_, i) => i + omamoriTokenIdOffset)
          const balances = await OmamoriContract.balanceOfBatch(accounts, ids)
          for (let i = 0; i < 6; i++) {
            expect(balances[i]).not.to.equal(0)
          }
        })

        it('check balanceOf', async () => {
          for (let i = 0; i < 6; i++) {
            expect(await OmamoriContract.balanceOf(await OtakiageContract.getAddress(), i + omamoriTokenIdOffset)).not.to.equal(0)
          }
        })
      })

      describe('check omamoriNFT image in OtakiageContract', () => {
        it('check image', async () => {
          for (let i = 0; i < 6; i++) {
            const nengajoInfo = await OmamoriContract.retrieveRegisteredNengajo(i + omamoriTokenIdOffset)
            expect(nengajoInfo.uri).to.equal(await getOmamoriMetaDataURL(i + omamoriTokenIdOffset))
          }
        })
      })
    })
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
  const network = await forwarder.runner?.provider?.getNetwork();
  const chainId = network ? network.chainId : 31337n; // デフォルトのHardhatチェーンID
  const typeData = getMetaTxTypeData(Number(chainId), await forwarder.getAddress());
  return { ...typeData, message: request };
}

export const signMetaTxRequest = async (signer: any, forwarder: ethers.Contract, input: any) => {
  const request = await buildRequest(forwarder, input)
  const toSign = await buildTypedData(forwarder, request)
  const signature = await signTypeData(signer, input.from, toSign)
  return { signature, request }
}
