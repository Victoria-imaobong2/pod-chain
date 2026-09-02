"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

const WalletMultiButton = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

export default function TestWalletPage() {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    async function fetchBalance() {
      if (publicKey) {
        try {
          const bal = await connection.getBalance(publicKey);
          setBalance(bal / LAMPORTS_PER_SOL);
        } catch (e) {
          console.error("Failed to fetch balance:", e);
        }
      } else {
        setBalance(null);
      }
    }
    fetchBalance();
  }, [publicKey, connection]);

  return (
    <main className="min-h-screen p-8 bg-slate-50 flex flex-col items-center justify-center">
      <div className="bg-white p-6 rounded-2xl shadow-md max-w-md w-full text-center space-y-4">
        <h1 className="text-xl font-bold text-slate-800">Solana Devnet Wallet Test</h1>
        
        <div className="flex justify-center">
          <WalletMultiButton className="!bg-teal-600 hover:!bg-teal-700 !rounded-xl" />
        </div>

        {connected && publicKey && (
          <div className="text-left bg-slate-100 p-4 rounded-xl space-y-2 text-xs font-mono break-all">
            <p><span className="font-bold text-slate-600">Address:</span> {publicKey.toBase58()}</p>
            <p><span className="font-bold text-slate-600">Balance:</span> {balance !== null ? `${balance} SOL` : "Fetching..."}</p>
          </div>
        )}
      </div>
    </main>
  );
}