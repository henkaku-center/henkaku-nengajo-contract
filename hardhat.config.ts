import * as dotenv from 'dotenv'
import { HardhatUserConfig } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'

dotenv.config()

const config: HardhatUserConfig = {
  solidity: '0.8.17',
  networks: {
    local: {
      url: 'http://localhost:8545',
      accounts: [`${process.env.LOCAL_PRIVATE_KEY}`],
      allowUnlimitedContractSize: true,
    },
  },
}

export default config
