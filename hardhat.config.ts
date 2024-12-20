import * as dotenv from 'dotenv'
import { HardhatUserConfig } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'
import 'hardhat-gas-reporter'
import "@nomicfoundation/hardhat-verify";
import type { NetworksUserConfig } from "hardhat/types";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-chai-matchers";

dotenv.config()

const config: HardhatUserConfig = {
  solidity: '0.8.20',
  networks: {
    // polygon: {
    //   url: process.env.POLYGON_ALCHEMY_KEY!,
    //   accounts: [process.env.MAIN_PRIVATE_KEY!],
    // },
    mumbai: {
      url: process.env.MUMBAI_ALCHEMY_KEY!,
      accounts: [process.env.TEST_PRIVATE_KEY!],
    },
    amoy: {
      url: process.env.AMOY_ALCHEMY_KEY!,
      accounts: [process.env.TEST_PRIVATE_KEY!],
      verify: {
        etherscan: {
          apiKey: process.env.POLYGONSCAN_API_KEY
        }
      }
    },
    holesky: {
      url: process.env.HOLESKY_ALCHEMY_KEY!,
      accounts: [process.env.TEST_PRIVATE_KEY!],
      verify: {
        etherscan: {
          apiKey: process.env.ETHERSCAN_API_KEY
        }
      }
    },
    // goerli: {
    //   url: process.env.GOERLI_ALCHEMY_KEY!,
    //   accounts: [process.env.TEST_PRIVATE_KEY!],
    // },
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
      holesky: process.env.ETHERSCAN_API_KEY!,
      polygonAmoy: process.env.POLYGONSCAN_API_KEY!,
    },
  },
} as HardhatUserConfig;

export default config
