// hooks/useCreateParcelHandler.ts
"use client";

import { useWriteContract } from "wagmi";
import { keccak256, encodePacked, parseEther } from "viem";
import { DeliveryEscrowABI } from "../DeliveryEscrow";
// Replace with your actual deployed contract address
const CONTRACT_ADDRESS = "0xYourDeployedContractAddressHere";

interface ParcelFormInputs {
  receiverEmail: string;
  receiverPhone: string;
  courierFeeEth: string;
  ipfsHash: string;
}

export function useCreateParcelHandler() {
  const { writeContractAsync, isPending: isSubmittingTx } = useWriteContract();

  const handleCreateParcel = async (data: ParcelFormInputs) => {
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