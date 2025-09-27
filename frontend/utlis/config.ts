import {
  scrollSepolia,
} from 'wagmi/chains'
import {
  getDefaultConfig,
} from '@rainbow-me/rainbowkit'

// Define Celo Sepolia chain with correct Chain ID and verified endpoints
const celoSepolia = {
  id: 11142220, // Correct Chain ID for Celo Sepolia
  name: 'Celo Sepolia Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Celo',
    symbol: 'CELO',
  },
  rpcUrls: {
    default: {
      http: [
        'https://celo-sepolia.drpc.org',
        'https://celo-sepolia-rpc.allthatnode.com',
      ],
    },
    public: {
      http: [
        'https://celo-sepolia.drpc.org',
        'https://celo-sepolia-rpc.allthatnode.com',
      ],
    },
  },
  blockExplorers: {
    default: {
      name: 'Celo Sepolia Explorer',
      url: 'https://sepolia.celoscan.io',
    },
  },
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 1000000,
    },
  },
  testnet: true,
} as const

// Optional: Celo Alfajores (more established testnet)
const celoAlfajores = {
  id: 44787,
  name: 'Celo Alfajores Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Celo',
    symbol: 'CELO',
  },
  rpcUrls: {
    default: {
      http: [
        'https://alfajores-forno.celo-testnet.org',
      ],
    },
    public: {
      http: [
        'https://alfajores-forno.celo-testnet.org',
      ],
    },
  },
  blockExplorers: {
    default: {
      name: 'Celo Alfajores Explorer',
      url: 'https://alfajores.celoscan.io',
    },
  },
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 1000000,
    },
  },
  testnet: true,
} as const

// Optional: Celo Mainnet
const celo = {
  id: 42220,
  name: 'Celo',
  nativeCurrency: {
    decimals: 18,
    name: 'Celo',
    symbol: 'CELO',
  },
  rpcUrls: {
    default: {
      http: ['https://forno.celo.org'],
    },
    public: {
      http: ['https://forno.celo.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Celo Explorer',
      url: 'https://celoscan.io',
    },
  },
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 42220,
    },
  },
  testnet: false,
} as const

export const config = getDefaultConfig({
  appName: 'HackNexus',
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID ?? '',
  chains: [
    scrollSepolia,
    celoSepolia,     // Use Celo Sepolia (new testnet) - Chain ID: 11142220
    // celoAlfajores, // Uncomment if you want to also support Alfajores
    // celo,          // Uncomment if you want to add Celo Mainnet
  ],
  ssr: true,
})