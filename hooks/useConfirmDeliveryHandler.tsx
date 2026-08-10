"use client";

import { useWriteContract, useAccount, usePublicClient } from "wagmi";
import { DeliveryEscrowABI } from "../lib/abi/DeliveryEscrow";

const CONTRACT_ADDRESS = "0x5fbdb2315678afecb367f032d93f642f64180aa3";

export function useConfirmDeliveryHandler() {
  const { writeContractAsync, isPending } = useWriteContract();
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();

  const handleConfirmDelivery = async (parcelIdNumeric: number, rawPin: string) => {
    if (!isConnected || !address) {
      throw new Error("Please connect your Web3 wallet before attempting to verify delivery.");
    }

    try {
      // Execute the smart contract function to verify PIN and release escrow payout
      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: DeliveryEscrowABI,
        functionName: "confirmDeliveryWithCode",
        args: [BigInt(parcelIdNumeric), rawPin],
      });

      console.log("Delivery verification transaction sent! Hash:", txHash);

      // Wait for on-chain block confirmation
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: txHash });
      }

      return { success: true, txHash };
    } catch (err: unknown) {
      console.error("Delivery confirmation error:", err);
      const error = err as { shortMessage?: string; message?: string };
      throw new Error(
        error.shortMessage || error.message || "Invalid PIN code or smart contract execution failure."
      );
    }
  };

  return { handleConfirmDelivery, isPending, isConnected, address };
}