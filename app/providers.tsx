"use client";

import React from "react";
import {
    getDefaultConfig,
    RainbowKitProvider,
    darkTheme,
    lightTheme
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from "wagmi";
import {base, hardhat} from 'wagmi/chains';
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";

import '@rainbow-me/rainbowkit/styles.css';

const config = getDefaultConfig({
    appName: 'podChain',
    projectId: 'ff747dfbea36ec05c5b46a631150a909',
    chains: [base, hardhat],
    ssr: true,
});
const queryClient = new QueryClient();

export function Web3Provider({ children } : { children: React.ReactNode }) {
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