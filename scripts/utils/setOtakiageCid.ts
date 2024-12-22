import { Otakiage } from "../../typechain-types"

export const TEST_CID = 'QmTZPgdptihxcobjoqy6YJikTYQ7A9UbuM6Yvo4BXbXAEc'
export const TEST_IMAGE_EXTENSION = '.png'

export const setOtakiageCid = async (OtakiageContract: Otakiage, cid: string) => {
  await OtakiageContract.setCID(cid, {
    gasLimit: 1000000
  })
}
