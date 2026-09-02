"use client";

import React, { useMemo, useState } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

// Default Solana Wallet Adapter styling
import "@solana/wallet-adapter-react-ui/styles.css";

export function Web3Provider({ children }: { children: React.ReactNode }) {
  // 1. Configure network & RPC endpoint (Devnet default)
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(
    () => process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl(network),
    [network]
  );

  // 2. Configure Wallets (Standard Wallets like Phantom/Solflare auto-detect via Wallet Standard)
  const wallets = useMemo(() => [], []);

  // 3. React Query client setup
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
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default Web3Provider;