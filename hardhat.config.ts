import * as dotenv from 'dotenv'
import { HardhatUserConfig } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'
import 'hardhat-gas-reporter'

dotenv.config()

const config: HardhatUserConfig = {
  solidity: '0.8.17',
  networks: {
    mumbai: {
      url: process.env.STAGING_ALCHEMY_KEY || '',
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    local: {
      url: 'http://localhost:8545',
      accounts: [`${process.env.LOCAL_PRIVATE_KEY}`],
      allowUnlimitedContractSize: true,
    },
  },
  etherscan: {
    apiKey: {
      polygonMumbai: process.env.ETHERSSCAN_API_KEY!,
    },
  },
}

export default config
