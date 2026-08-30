"use client";

import React, { useState } from "react";
import { WagmiProvider } from "wagmi";
import { hardhat, baseSepolia, base } from "wagmi/chains";
import { http } from "viem";
import {
  RainbowKitProvider,
  darkTheme,
  getDefaultConfig,
} from "@rainbow-me/rainbowkit";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

import "@rainbow-me/rainbowkit/styles.css";

const config = getDefaultConfig({
  appName: "POD Chain Logistics",
  projectId: "ff747dfbea36ec05c5b46a631150a909",
  chains: [hardhat, baseSepolia, base],
  transports: {
    [hardhat.id]: http("http://127.0.0.1:8545"),
    [baseSepolia.id]: http(),
    [base.id]: http(),
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