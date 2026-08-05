"use client";

import { useState  }from "react";
import {
    getDefaultConfig,
    RainbowKitProvider,
    darkTheme,
    lightTheme
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from "wagmi";
import {base, baseSepolia, hardhat} from 'wagmi/chains';
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import { http } from 'viem';
import '@rainbow-me/rainbowkit/styles.css';

const config = getDefaultConfig({
  appName: 'podChain',
  projectId: 'ff747dfbea36ec05c5b46a631150a909',
  chains: [hardhat, baseSepolia, base],
  ssr: true,
  transports: {
    [hardhat.id]: http('http://127.0.0.1:8545'),
    [baseSepolia.id]: http(),
    [base.id]: http(),
  },
});

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [mounted, setMounted] = useState(false);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider 
          theme={darkTheme({
            accentColor: "#d94488",
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}