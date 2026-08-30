"use client";

import { useState } from "react";
import { useWriteContract, useAccount, usePublicClient } from "wagmi";

const CONTRACT_ADDRESS = "0x5fbdb2315678afecb367f032d93f642f64180aa3" as const;

export const DELIVERY_ESCROW_ABI = [
  {
    type: "function",
    name: "parcelCount",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "confirmDeliveryWithCode",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_id", type: "uint256" },
      { name: "_secretCode", type: "string" },
    ],
    outputs: [],
  },
] as const;

export function useConfirmDeliveryHandler() {
  const { writeContractAsync } = useWriteContract();
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [isPending, setIsPending] = useState(false);

  const handleConfirmDelivery = async (parcelIdInput: number | string, rawPin: string) => {
    if (!isConnected || !address) {
      throw new Error("Please connect your Web3 wallet first.");
    }

    setIsPending(true);

    try {
      let targetId = BigInt(Number(parcelIdInput) || 1);

      if (publicClient) {
        const totalCount = await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: DELIVERY_ESCROW_ABI,
          functionName: "parcelCount",
        });

        if (totalCount === BigInt(0)) {
          throw new Error("No parcels found on-chain. Please create a parcel first.");
        }

        if (targetId <= BigInt(0) || targetId > totalCount) {
          targetId = totalCount;
        }
      }

      console.log(`Submitting single-step confirmDeliveryWithCode for ID #${targetId} with PIN:`, rawPin);

      // Execute ONLY ONE transaction in MetaMask
      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: DELIVERY_ESCROW_ABI,
        functionName: "confirmDeliveryWithCode",
        args: [targetId, rawPin],
        gas: BigInt(300000),
      });

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: txHash });
      }

      return { success: true, txHash };
    } catch (err: unknown) {
      console.error("Settlement error:", err);
      const error = err as { shortMessage?: string; message?: string };
      throw new Error(error.shortMessage || error.message || "Confirmation failed");
    } finally {
      setIsPending(false);
    }
  };

  return {
    handleConfirmDelivery,
    isPending,
    isConnected,
    address,
  };
}