'use client';

import { OnchainKitProvider } from '@coinbase/onchainkit';
import { baseSepolia } from 'wagmi/chains'; // add baseSepolia for testing
import { createContext, useState, useContext } from 'react'
import Navbar from '@/components/Navbar'
import { WagmiProvider, createConfig, http } from 'wagmi';
import { coinbaseWallet } from 'wagmi/connectors';

const UserContext = createContext(null)

export const wagmiConfig = createConfig({
  chains: [baseSepolia],
  connectors: [
    coinbaseWallet({
      appName: 'onchainkit',
    }),
  ],
  ssr: true,
  transports: {
    [baseSepolia.id]: http(),
  },
});

export function Providers({ children }) {

  const [userId, setUserId] = useState()
  const [authed, setAuthed] = useState()

  const userContextValue = { userId, setUserId, authed, setAuthed }

  return (
    <UserContext.Provider value={userContextValue}>
      <OnchainKitProvider
        apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
        chain={baseSepolia} // add baseSepolia for testing
        config={{
          wallet: {display: 'modal'},
          appearance: {
            mode: 'auto', // 'auto' | 'light' | 'dark'
            theme: 'hacker'
        },
      }
      }
      >
        <WagmiProvider config={wagmiConfig}>
              {userId && <Navbar />}
              {children}
        </WagmiProvider>
      </OnchainKitProvider>
    </UserContext.Provider>
  );
}

export const useUserContext = () => useContext(UserContext)