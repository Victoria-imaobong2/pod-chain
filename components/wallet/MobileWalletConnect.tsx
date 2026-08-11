"use client";

import { useState } from "react";
import {
  useAccount,
  useConnect,
  useDisconnect,
} from "wagmi";
import {
  Wallet,
  X,
  ShieldCheck,
} from "lucide-react";

export default function MobileWalletConnect() {
  const { address, isConnected } = useAccount();

  const {
    connect,
    connectors,
    isPending,
    error,
  } = useConnect();

  const { disconnect } = useDisconnect();

  const [open, setOpen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  if (isConnected) {
    return (
      <button
        type="button"
        onClick={() => disconnect()}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white"
      >
        <Wallet size={18} />

        {address
          ? `${address.slice(0, 6)}...${address.slice(-4)}`
          : "Connected"}
      </button>
    );
  }

  // The first connector is our injected browser-wallet connector.
  const injectedConnector = connectors.find(
    (connector) => connector.type === "injected"
  );

  // WalletConnect is our secondary option.
  const walletConnectConnector = connectors.find(
    (connector) => connector.type === "walletConnect"
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#d94488] px-4 py-3 font-semibold text-white transition active:scale-[0.98]"
      >
        <Wallet size={18} />
        Connect Wallet
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center">
          <div className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl">

            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-zinc-900">
                  Connect your wallet
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Securely connect to continue.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* META MASK / BROWSER WALLET */}

            {injectedConnector && (
              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  connect(
                    {
                      connector: injectedConnector,
                    },
                    {
                      onSuccess: () => {
                        setOpen(false);
                      },
                    }
                  );
                }}
                className="mb-3 flex w-full items-center gap-4 rounded-2xl border border-zinc-200 p-4 text-left transition active:scale-[0.99] hover:bg-zinc-50 disabled:opacity-50"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-2xl">
                  🦊
                </div>

                <div className="flex-1">
                  <p className="font-semibold text-zinc-900">
                    MetaMask
                  </p>

                  <p className="text-sm text-zinc-500">
                    Recommended
                  </p>
                </div>
              </button>
            )}

            {/* OTHER WALLETS */}

            {walletConnectConnector && (
              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  connect(
                    {
                      connector: walletConnectConnector,
                    },
                    {
                      onSuccess: () => {
                        setOpen(false);
                      },
                    }
                  );
                }}
                className="mb-3 flex w-full items-center gap-4 rounded-2xl border border-zinc-200 p-4 text-left transition active:scale-[0.99] hover:bg-zinc-50 disabled:opacity-50"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 text-2xl">
                  ◇
                </div>

                <div className="flex-1">
                  <p className="font-semibold text-zinc-900">
                    Other wallets
                  </p>

                  <p className="text-sm text-zinc-500">
                    Connect with WalletConnect
                  </p>
                </div>
              </button>
            )}

            {isPending && (
              <p className="mt-4 text-center text-sm text-zinc-500">
                Waiting for wallet approval...
              </p>
            )}

            {error && (
              <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">
                {error.message}
              </p>
            )}

            <button
              type="button"
              onClick={() => setShowInfo(!showInfo)}
              className="mt-4 flex w-full items-center justify-center gap-2 text-sm font-medium text-[#d94488]"
            >
              <ShieldCheck size={16} />

              Why do I need a wallet?
            </button>

            {showInfo && (
              <div className="mt-3 rounded-xl bg-zinc-50 p-4 text-sm leading-6 text-zinc-600">
                Your wallet is used to approve blockchain
                transactions, such as creating a delivery escrow.
                Your private keys and wallet password are never
                shared with podChain.
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}