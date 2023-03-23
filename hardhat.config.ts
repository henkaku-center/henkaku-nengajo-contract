import * as dotenv from 'dotenv'
import { HardhatUserConfig } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'
import 'hardhat-gas-reporter'

dotenv.config()

const config: HardhatUserConfig = {
  solidity: '0.8.17',
  networks: {
    polygon: {
      url: process.env.POLYGON_ALCHEMY_KEY!,
      accounts: [process.env.MAIN_PRIVATE_KEY!],
      gasPrice: 110000000000,
    },
    mumbai: {
      url: process.env.MUMBAI_ALCHEMY_KEY!,
      accounts: [process.env.TEST_PRIVATE_KEY!],
    },
    goerli: {
      url: process.env.GOERLI_ALCHEMY_KEY!,
      accounts: [process.env.TEST_PRIVATE_KEY!],
    },
    local: {
      url: 'http://localhost:8545',
      accounts: [`${process.env.LOCAL_PRIVATE_KEY}`],
      allowUnlimitedContractSize: true,
    },
  },
  etherscan: {
    apiKey: {
      polygonMumbai: process.env.POLYGONSCAN_API_KEY!,
      polygon: process.env.POLYGONSCAN_API_KEY!,
      goerli: process.env.ETHERSCAN_API_KEY!,
    },
  },
}

export default config
