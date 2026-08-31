"use client";

import React, { useState } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { baseSepolia, base, hardhat } from "wagmi/chains";
import {
  RainbowKitProvider,
  darkTheme,
  connectorsForWallets,
} from "@rainbow-me/rainbowkit";
import {
  metaMaskWallet,
  injectedWallet,
  rainbowWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

import "@rainbow-me/rainbowkit/styles.css";

const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
  "ff747dfbea36ec05c5b46a631150a909";

// 1. Build connectors list containing MetaMask & Injected
const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [
        metaMaskWallet,
        injectedWallet,
        rainbowWallet,
        walletConnectWallet,
      ],
    },
  ],
  {
    appName: "POD Chain Logistics",
    projectId: projectId,
  }
);

// 2. Pass connectors directly into createConfig
const config = createConfig({
  connectors,
  chains: [baseSepolia, base, hardhat],
  transports: {
    [baseSepolia.id]: http(),
    [base.id]: http(),
    [hardhat.id]: http("http://127.0.0.1:8545"),
  },
  ssr: false,
});

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#0d9488",
            borderRadius: "medium",
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default Web3Provider;