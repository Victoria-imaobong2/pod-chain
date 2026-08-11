"use client";

import { useState } from "react";
import { WagmiProvider, createConfig } from "wagmi";
import { injected, walletConnect } from "wagmi/connectors";
import { base, baseSepolia, hardhat } from "wagmi/chains";
import { http } from "viem";
import {
  RainbowKitProvider,
  darkTheme,
} from "@rainbow-me/rainbowkit";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

import "@rainbow-me/rainbowkit/styles.css";

const config = createConfig({
  chains: [hardhat, baseSepolia, base],

  connectors: [
    injected({
      shimDisconnect: true,
    }),

    walletConnect({
      projectId: "ff747dfbea36ec05c5b46a631150a909",
    }),
  ],

  transports: {
    [hardhat.id]: http("http://127.0.0.1:8545"),
    [baseSepolia.id]: http(),
    [base.id]: http(),
  },

  ssr: true,
});

export function Web3Provider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(() => new QueryClient());

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