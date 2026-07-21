"use client";

import { useWriteContract, useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { keccak256, encodePacked, parseEther } from "viem";
import { DeliveryEscrowABI } from "../lib/abi/DeliveryEscrow";
// My deployed contract address
const CONTRACT_ADDRESS = "0xa4e00acfb49d65ad91239aa968c57341a6361c84";

interface ParcelFormInputs {
  receiverEmail: string;
  receiverPhone: string;
  courierFeeEth: string;
  ipfsHash: string;
}

export function useCreateParcelHandler() {
  const { writeContractAsync, isPending: isSubmittingTx } = useWriteContract();

  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();

  const handleCreateParcel = async (data: ParcelFormInputs) => {

    if (!isConnected) {
      // Automatically trigger RainbowKit wallet modal if not connected
      if (openConnectModal) {
        openConnectModal();
      } else {
        alert("Please connect your wallet to create a parcel.");
      }
      return;

    }
    try {
      // 1. Generate a cryptographically secure 6-digit PIN
      const array = new Uint32Array(1);
      crypto.getRandomValues(array);
      const rawPin = (100000 + (array[0] % 900000)).toString();

      // 2. Hash it locally using viem
      const confirmationHash = keccak256(encodePacked(["string"], [rawPin]));

      // 3. Execute Smart Contract Transaction via Wagmi
      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: DeliveryEscrowABI,
        functionName: "createParcel",
        args: [confirmationHash, data.ipfsHash],
        value: parseEther(data.courierFeeEth),
      });

      console.log("Transaction sent! Hash:", txHash);

      // 4. Send plain PIN and details to FastAPI backend
      const backendResponse = await fetch("http://localhost:8000/api/v1/parcels/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parcelId: 1, // Pass generated or returned parcel ID
          receiverEmail: data.receiverEmail,
          receiverPhone: data.receiverPhone,
          pin: rawPin,
        }),
      });

      if (!backendResponse.ok) {
        throw new Error("Failed to send notification to backend");
      }

      const backendData = await backendResponse.json();
      return { success: true, txHash, qrCodeUrl: backendData.qrCodeUrl };

    } catch (error) {
      console.error("Error creating parcel:", error);
      throw error;
    }
  };

  return { handleCreateParcel, isSubmittingTx };
}