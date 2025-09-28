import {
  scrollSepolia,
  scroll, // Add Scroll mainnet
  mainnet, // Add Ethereum mainnet
  polygon, // Add Polygon mainnet
  arbitrum, // Add Arbitrum mainnet
  optimism, // Add Optimism mainnet
  base, // Add Base mainnet
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

// Celo Alfajores (more established testnet)
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
      blockCreated: 14569001,
    },
  },
  testnet: true,
} as const

// Celo Mainnet
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
      blockCreated: 13112599, // Approximate block when Multicall3 was deployed
    },
  },
  testnet: false,
} as const

export const config = getDefaultConfig({
  appName: 'HackNexus',
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID ?? '',
  chains: [
    // Mainnets
    mainnet,          // Ethereum Mainnet - Chain ID: 1
    polygon,          // Polygon Mainnet - Chain ID: 137
    arbitrum,         // Arbitrum One - Chain ID: 42161
    optimism,         // Optimism Mainnet - Chain ID: 10
    base,             // Base Mainnet - Chain ID: 8453
    scroll,           // Scroll Mainnet - Chain ID: 534352
    celo,             // Celo Mainnet - Chain ID: 42220
    
    // Testnets
    scrollSepolia,    // Scroll Sepolia Testnet - Chain ID: 534351
    celoSepolia,      // Celo Sepolia Testnet - Chain ID: 11142220
    // celoAlfajores,    // Uncomment if you want to also support Alfajores - Chain ID: 44787
  ],
  ssr: true,
})

// Alternative minimal configuration (testnets only)
export const testnetConfig = getDefaultConfig({
  appName: 'HackNexus',
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID ?? '',
  chains: [
    scrollSepolia,     // Scroll Sepolia Testnet
    celoSepolia,       // Celo Sepolia Testnet
    celoAlfajores,     // Celo Alfajores Testnet
  ],
  ssr: true,
})

// Production configuration (mainnets only)
export const productionConfig = getDefaultConfig({
  appName: 'HackNexus',
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID ?? '',
  chains: [
    mainnet,           // Ethereum Mainnet
    polygon,           // Polygon Mainnet  
    arbitrum,          // Arbitrum One
    optimism,          // Optimism Mainnet
    base,              // Base Mainnet
    scroll,            // Scroll Mainnet
    celo,              // Celo Mainnet
  ],
  ssr: true,
})