import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { Omamori } from '../../typechain-types'
import { omamoriTokenIdOffset, omamoriTypeCount } from './setUpOmamoriForTestEnv'

export const mintOmamorisForTestEnv = async (OmamoriContract: Omamori, user1: SignerWithAddress, user2: SignerWithAddress) => {
  for (let i = 0; i <= omamoriTypeCount; i++) {
    const tx = await OmamoriContract.connect(user1).mint(i + omamoriTokenIdOffset);
    await (tx as any).wait();
  }

  const tx = await OmamoriContract.connect(user2).mint(0 + omamoriTokenIdOffset);
  await (tx as any).wait();
}
