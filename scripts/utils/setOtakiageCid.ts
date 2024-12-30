import { Otakiage } from "../../typechain-types"

export const TEST_CID = 'bafybeihporu6szwjnjmlvtvswloc6zr26fwuyuls42e3dnle2gtu4rbteq'
export const TEST_IMAGE_EXTENSION = '.png'

export const setOtakiageCid = async (OtakiageContract: Otakiage, cid: string) => {
  await OtakiageContract.setCID(cid, {
    gasLimit: 1000000
  })
}
