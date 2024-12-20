import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { Omamori } from '../../typechain-types'
import { omamoriTokenIdOffset, omamoriTypeCount } from './setUpOmamoriForTestEnv'

export const mintOmamorisForTestEnv = async (OmamoriContract: Omamori, user1: SignerWithAddress, user2: SignerWithAddress) => {

  for (let i = 0; i <= omamoriTypeCount; i++) {
    await OmamoriContract.connect(user1).mint(i + omamoriTokenIdOffset)
  }

  await OmamoriContract.connect(user2).mint(0 + omamoriTokenIdOffset)
}