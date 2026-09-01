import { useState } from "react";
import { useAccount, useWriteContract, usePublicClient } from "wagmi";
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
  const { isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const [isPending, setIsPending] = useState(false);

  const handleConfirmDelivery = async (parcelId: number | string, pin: string) => {
    setIsPending(true);
    try {
      if (!isConnected) {
        throw new Error("Wallet not connected. Connect your courier wallet.");
      }

      const idBigInt = BigInt(parcelId);

      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: ESCROW_DELIVERY_ABI,
        functionName: "confirmDelivery",
        args: [idBigInt, pin],
        chainId: 84532,
        gas: BigInt(300000),
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