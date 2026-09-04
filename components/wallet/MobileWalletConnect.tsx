"use client";

import React, { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Wallet, ShieldCheck, LogOut, ExternalLink } from "lucide-react";

export default function MobileWalletConnect() {
  const { publicKey, connected, disconnect, select, wallets } = useWallet();
  const { setVisible } = useWalletModal();
  const [showInfo, setShowInfo] = useState(false);

  const address = publicKey ? publicKey.toBase58() : null;

  // Single-tap connect flow designed for Mobile Web & PWA
  const handleConnect = () => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      // Find Phantom adapter from registered wallets
      const phantom = wallets.find((w) => w.adapter.name === "Phantom");
      if (phantom) {
        select(phantom.adapter.name);
      }
    }

    // Open standard Solana Wallet Modal (handles native deep links cleanly)
    setVisible(true);
  };

  // State 1: Connected View
  if (connected && address) {
    return (
      <div className="flex w-full flex-col gap-2">
        <div className="flex items-center justify-between rounded-xl bg-zinc-900 px-4 py-3 text-white shadow">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-sm font-semibold">
              {`${address.slice(0, 4)}...${address.slice(-4)}`}
            </span>
          </div>

          <button
            type="button"
            onClick={() => disconnect()}
            className="flex items-center gap-1 text-xs font-medium text-rose-400 hover:text-rose-300 transition"
            title="Disconnect Wallet"
          >
            <LogOut size={14} />
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  // State 2: Disconnected View (1-Tap direct connect)
  return (
    <div className="flex w-full flex-col gap-2">
      <button
        type="button"
        onClick={handleConnect}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3.5 font-semibold text-white transition active:scale-[0.98] hover:bg-teal-700 shadow-md cursor-pointer"
      >
        <Wallet size={18} />
        Connect Solana Wallet
      </button>

      {/* Collapsible Info for users new to Web3 */}
      <button
        type="button"
        onClick={() => setShowInfo(!showInfo)}
        className="flex items-center justify-center gap-1.5 text-xs font-medium text-teal-600 dark:text-teal-400 hover:underline pt-1 cursor-pointer"
      >
        <ShieldCheck size={14} />
        Why do I need a wallet?
      </button>

      {showInfo && (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50 p-3 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
          Your wallet authorizes transactions, funds delivery escrows, and signs
          proof tokens. Private keys remain secure on your device.
        </div>
      )}
    </div>
  );
}