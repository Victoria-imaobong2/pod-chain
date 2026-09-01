import { useState } from "react";
import { useAccount, useWalletClient, usePublicClient, useSwitchChain } from "wagmi";
import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";

export const ESCROW_DELIVERY_ABI = [
  {
    type: "function",
    name: "confirmDelivery",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_parcelId", type: "uint256" },
      { name: "_pin", type: "string" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "parcelCount",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS ||
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  "0x5ec609ee5e21c8e00050228a1c51077589be5e39") as `0x${string}`;

const directPublicClient = createPublicClient({
  chain: baseSepolia,
  transport: http("https://sepolia.base.org"),
});

export function useConfirmDeliveryHandler() {
  const { isConnected, address, chainId } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { switchChainAsync } = useSwitchChain();
  const publicClient = usePublicClient();
  const [isPending, setIsPending] = useState(false);

  const handleConfirmDelivery = async (parcelId: number | string, pin: string) => {
    setIsPending(true);
    try {
      if (!isConnected || !walletClient || !address) {
        throw new Error("Wallet not connected. Please connect your courier wallet.");
      }

      // Auto-switch MetaMask to Base Sepolia if connected to a different network
      if (chainId !== baseSepolia.id && switchChainAsync) {
        try {
          await switchChainAsync({ chainId: baseSepolia.id });
        } catch (switchErr) {
          console.warn("Could not auto-switch chain:", switchErr);
        }
      }

      const idBigInt = BigInt(parcelId);

      const txHash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: ESCROW_DELIVERY_ABI,
        functionName: "confirmDelivery",
        args: [idBigInt, pin],
        account: address,
        chain: baseSepolia,
      });

      const client = publicClient || directPublicClient;
      await client.waitForTransactionReceipt({ hash: txHash });

      return {
        success: true,
        txHash,
      };
    } catch (err: unknown) {
      console.error("Confirm delivery contract error:", err);
      const message = err instanceof Error ? err.message : "Failed to confirm delivery";
      throw new Error(message);
    } finally {
      setIsPending(false);
    }
  };

  return { handleConfirmDelivery, isPending };
}