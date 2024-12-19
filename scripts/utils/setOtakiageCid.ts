import { Otakiage } from "../../typechain-types"

export const setOtakiageCid = async (OtakiageContract: Otakiage, cid: string) => {
  await OtakiageContract.setCID(cid)
}
