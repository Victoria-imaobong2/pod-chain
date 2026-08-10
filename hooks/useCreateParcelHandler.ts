"use client";

import { useState } from "react";
import { useWriteContract, useAccount, usePublicClient } from "wagmi";
import { DeliveryEscrowABI } from "../lib/abi/DeliveryEscrow";

type HexAddress = `0x${string}`;
const CONTRACT_ADDRESS = "0x5fbdb2315678afecb367f032d93f642f64180aa3" as HexAddress;

export function useCreateParcelHandler() {
  const { writeContractAsync, isPending } = useWriteContract();
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCreateParcel = async (
    itemDescription: string,
    receiverPhone: string,
    courierAddress: string,
    amountInEth: string
  ) => {
    setErrorMsg(null);

    if (!isConnected || !address) {
      const msg = "Please connect your wallet first.";
      setErrorMsg(msg);
      throw new Error(msg);
    }

    // Ensure addresses are properly formatted as 0x hex strings
    const formattedCourier: HexAddress = (
      courierAddress.startsWith("0x") ? courierAddress : `0x${courierAddress}`
    ) as HexAddress;

    try {
      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: DeliveryEscrowABI,
        functionName: "createParcel",
        // Force the args tuple as 'any' to bypass wagmi's strict tuple mismatch
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        args: [itemDescription, receiverPhone, formattedCourier] as any,
        value: BigInt(Math.floor(Number.parseFloat(amountInEth || "0") * 1e18)),
      });

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: txHash });
      }

      return { success: true, txHash };
    } catch (err: unknown) {
      const error = err as { shortMessage?: string; message?: string };
      const fallbackMsg = error?.shortMessage || error?.message || "Failed to create escrow parcel.";
      setErrorMsg(fallbackMsg);
      throw new Error(fallbackMsg);
    }
  };

  return { handleCreateParcel, isPending, isConnected, errorMsg };
}