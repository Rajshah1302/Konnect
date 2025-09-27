import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true, // Add this to help with stack too deep issues
    },
  },
  networks: {
    // Celo Mainnet
    celo: {
      url: "https://forno.celo.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 42220,
      gasPrice: 200000000000, // 200 gwei
      timeout: 120000, // 2 minutes timeout
      httpHeaders: {
        "User-Agent": "hardhat",
      },
    },
    // Celo Sepolia Testnet (existing)
    celoSepolia: {
      url: "https://forno.celo-sepolia.celo-testnet.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11142220,
      gasPrice: 200000000000,
      timeout: 120000, // 2 minutes timeout
      httpHeaders: {
        "User-Agent": "hardhat",
      },
    },
  },
  etherscan: {
    apiKey: {
      // Celo Mainnet
      celo: process.env.CELOSCAN_API_KEY || "",
      // Celo Sepolia Testnet (existing)
      celoSepolia: process.env.CELOSCAN_API_KEY || "",
    },
    customChains: [
      // Celo Mainnet
      {
        network: "celo",
        chainId: 42220,
        urls: {
          apiURL: "https://api.celoscan.io/api",
          browserURL: "https://celoscan.io",
        },
      },
      // Celo Sepolia Testnet (existing)
      {
        network: "celoSepolia",
        chainId: 11142220,
        urls: {
          apiURL: "https://api-sepolia.celoscan.io/api",
          browserURL: "https://celo-sepolia.blockscout.com",
        },
      },
    ],
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  mocha: {
    timeout: 120000, 
  },
};

export default config;