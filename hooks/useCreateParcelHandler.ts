"use client";

import { useWriteContract, useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { keccak256, encodePacked, parseEther } from "viem";
import { DeliveryEscrowABI } from "../lib/abi/DeliveryEscrow";

// Your deployed contract address
const CONTRACT_ADDRESS = "0xa4e00acfb49d65ad91239aa968c57341a6361c84";

interface ParcelFormInputs {
  receiverEmail: string;
  receiverPhone: string;
  courierFeeEth: string;
  ipfsHash?: string;
}

export function useCreateParcelHandler() {
  const { writeContractAsync, isPending: isSubmittingTx } = useWriteContract();
  const { address, isConnected, chain } = useAccount();
  const { openConnectModal } = useConnectModal();

  const handleCreateParcel = async (
    data: ParcelFormInputs,
    file?: File | null
  ) => {
    // 1. Guard check: Trigger modal if disconnected
    if (!isConnected || !address) {
      if (openConnectModal) {
        openConnectModal();
      } else {
        alert("Please connect your wallet to create a parcel.");
      }
      return;
    }

    try {
      let targetIpfsHash = data.ipfsHash || "QmSampleIpfsHashFromPinata";

      // 2. Upload file to Pinata IPFS if provided
      if (file) {
        const formData = new FormData();
        formData.append("file", file);

        const pinataRes = await fetch("/api/pinata", {
          method: "POST",
          body: formData,
        });

        if (!pinataRes.ok) {
          throw new Error("Failed to upload package photo to Pinata IPFS");
        }

        const pinataData = await pinataRes.json();
        targetIpfsHash = pinataData.ipfsHash || pinataData.IpfsHash;
      }

      // 3. Generate a cryptographically secure 6-digit PIN
      const array = new Uint32Array(1);
      crypto.getRandomValues(array);
      const rawPin = (100000 + (array[0] % 900000)).toString();

      // Hash it locally using viem
      const confirmationHash = keccak256(encodePacked(["string"], [rawPin]));

      // 4. Execute Smart Contract Transaction via Wagmi
      // FIX: Use `targetIpfsHash` instead of `data.ipfsHash`
      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: DeliveryEscrowABI,
        functionName: "createParcel",
        args: [confirmationHash, targetIpfsHash],
        value: parseEther(data.courierFeeEth || "0"),
      });

      console.log("Transaction sent! Hash:", txHash);

      // 5. Send plain PIN and details to FastAPI backend
      const backendResponse = await fetch("http://localhost:8000/api/v1/parcels/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parcelId: 1,
          receiverEmail: data.receiverEmail,
          receiverPhone: data.receiverPhone,
          pin: rawPin,
          ipfsHash: targetIpfsHash,
          txHash,
          senderAddress: address, // Included sender address
        }),
      });

      if (!backendResponse.ok) {
        throw new Error("Failed to send notification to backend");
      }

      const backendData = await backendResponse.json();
      return { 
        success: true, 
        txHash, 
        ipfsHash: targetIpfsHash,
        pin: rawPin,
        qrCodeUrl: backendData.qrCodeUrl 
      };

    } catch (error) {
      console.error("Error creating parcel:", error);
      throw error;
    }
  };

  return { handleCreateParcel, isSubmittingTx, isConnected, address };
}