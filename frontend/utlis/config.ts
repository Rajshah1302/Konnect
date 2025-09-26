import {
  scrollSepolia,
} from 'wagmi/chains'
import {
  getDefaultConfig,
} from '@rainbow-me/rainbowkit'

export const config = getDefaultConfig({
  appName: 'HackNexus',
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID ?? '',
  chains: [
    scrollSepolia,
  ],
  ssr: true,
})
