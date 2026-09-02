"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useWallet } from "@solana/wallet-adapter-react";
import { Wallet, X, ShieldCheck } from "lucide-react";

// Dynamically import WalletMultiButton to prevent SSR hydration errors
const WalletMultiButton = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

export default function MobileWalletConnect() {
  const { publicKey, connected, disconnect } = useWallet();
  const [open, setOpen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const address = publicKey ? publicKey.toBase58() : null;

  if (connected && address) {
    return (
      <button
        type="button"
        onClick={() => disconnect()}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white cursor-pointer"
      >
        <Wallet size={18} />
        {`${address.slice(0, 4)}...${address.slice(-4)}`} (Disconnect)
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3 font-semibold text-white transition active:scale-[0.98] hover:bg-teal-700 cursor-pointer"
      >
        <Wallet size={18} />
        Connect Solana Wallet
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-zinc-900">
                  Connect Solana Wallet
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Select Phantom or your preferred Solana wallet.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100 cursor-pointer"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col items-center justify-center py-4">
              <WalletMultiButton className="!bg-teal-600 hover:!bg-teal-700 !w-full !justify-center !h-12 !rounded-2xl !text-sm !font-bold" />
            </div>

            <button
              type="button"
              onClick={() => setShowInfo(!showInfo)}
              className="mt-4 flex w-full items-center justify-center gap-2 text-sm font-medium text-teal-600 cursor-pointer"
            >
              <ShieldCheck size={16} />
              Why do I need a wallet?
            </button>

            {showInfo && (
              <div className="mt-3 rounded-xl bg-zinc-50 p-4 text-sm leading-6 text-zinc-600">
                Your wallet signs Solana blockchain transactions, locks escrow deposits, and secures delivery handoffs. Your private keys are never shared with POD Chain.
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}