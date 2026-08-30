"use client";

import { useState } from "react";
import { parseEther } from "viem";
import { useWriteContract, usePublicClient, useAccount } from "wagmi";
import { API_BASE_URL } from "@/lib/config";

const CONTRACT_ADDRESS = "0x5fbdb2315678afecb367f032d93f642f64180aa3" as const;

export const ESCROW_CREATE_ABI = [
  {
    type: "function",
    name: "createParcel",
    stateMutability: "payable",
    inputs: [
      { name: "_receiverPhone", type: "string" },
      { name: "_destinationAddress", type: "string" },
      { name: "_contentsName", type: "string" },
      { name: "_confirmationHash", type: "bytes32" },
      { name: "_ipfsHash", type: "string" },
    ],
    outputs: [],
  },
] as const;

interface FormDataInput {
  receiverEmail: string;
  receiverPhone: string;
  courierFeeEth: string;
  ipfsHash?: string;
  contentsName: string;
  destinationAddress: string;
}

export function useCreateParcelHandler() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const [isPending, setIsPending] = useState(false);

  const handleCreateParcel = async (
    formData: FormDataInput,
    selectedFile: File | null
  ) => {
    setIsPending(true);

    try {
      const baseUrl = API_BASE_URL || "http://127.0.0.1:8000";

      // 1. Upload proof photo to IPFS (if file selected)
      let ipfsCid = formData.ipfsHash || "QmDefaultPlaceholderHash";
      if (selectedFile) {
        try {
          const uploadData = new FormData();
          uploadData.append("file", selectedFile);
          const ipfsRes = await fetch("/api/ipfs", {
            method: "POST",
            body: uploadData,
          });
          if (ipfsRes.ok) {
            const ipfsJson = await ipfsRes.json();
            ipfsCid = ipfsJson.cid || ipfsJson.ipfsHash || ipfsCid;
          }
        } catch (e) {
          console.warn("IPFS fallback used:", e);
        }
      }

      // 2. Request OTP & confirmation hash from backend
      const otpRes = await fetch(`${baseUrl}/api/v1/parcels/generate-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiver_email: formData.receiverEmail,
          receiver_phone: formData.receiverPhone,
        }),
      });

      if (!otpRes.ok) {
        throw new Error("Failed to generate delivery OTP hash from backend.");
      }

      const otpData = await otpRes.json();
      const confirmationHash = (otpData.confirmation_hash || otpData.confirmationHash) as `0x${string}`;
      const trackingNumber = otpData.tracking_number || `POD-${Date.now()}`;

      // 3. Call createParcel with all 5 required arguments
      const bountyWei = parseEther(formData.courierFeeEth || "0.01");
      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: ESCROW_CREATE_ABI,
        functionName: "createParcel",
        args: [
          formData.receiverPhone,
          formData.destinationAddress,
          formData.contentsName,
          confirmationHash,
          ipfsCid,
        ],
        value: bountyWei,
        gas: BigInt(500000),
      });

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: txHash });
      }

      // 4. Sync metadata to backend
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      await fetch(`${baseUrl}/api/v1/parcels/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          tracking_number: trackingNumber,
          contents_name: formData.contentsName,
          destination_address: formData.destinationAddress,
          receiver_phone: formData.receiverPhone,
          receiver_email: formData.receiverEmail,
          sender_wallet: address,
          tx_hash: txHash,
          amount_eth: formData.courierFeeEth,
          ipfs_hash: ipfsCid,
        }),
      });

      return {
        success: true,
        txHash,
        trackingNumber,
      };
    } finally {
      setIsPending(false);
    }
  };

  return {
    handleCreateParcel,
    isPending,
  };
}