"use client";

import { useState } from "react";
import { parseEther } from "viem";
import { useWriteContract, usePublicClient, useAccount } from "wagmi";
import { API_BASE_URL } from "@/lib/config";

const CONTRACT_ADDRESS = (
  process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS || process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  "0x5ec609ee5e21c8e00050228a1c51077589be5e39") as `0x${string}`;

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
      const baseUrl = API_BASE_URL || "https://podchain-backend.onrender.com";

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

      // 2. Request confirmation hash from backend (Sender only receives the hash)
      const otpRes = await fetch(`${baseUrl}/api/v1/parcels/generate-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          receiver_email: formData.receiverEmail,
          receiver_phone: formData.receiverPhone,
        }),
      });

      if (!otpRes.ok) {
        const errDetail = await otpRes.json().catch(() => ({}));
        console.error("Backend Generate-OTP Error:", errDetail);
        throw new Error(
          errDetail.detail ||
            `Backend returned ${otpRes.status}: ${otpRes.statusText}`
        );
      }

      const otpData = await otpRes.json();
      const rawHash = otpData.confirmationHash || otpData.confirmation_hash;

      if (!rawHash) {
        throw new Error("Invalid response: confirmationHash missing from backend.");
      }

      const confirmationHash = (
        rawHash.startsWith("0x") ? rawHash : `0x${rawHash}`
      ) as `0x${string}`;

      const trackingNumber = otpData.tracking_number || `POD-${Date.now()}`;

      // 3. Call createParcel with bytes32 hash (no raw pin)
      const bountyWei = parseEther(formData.courierFeeEth || "0.0001");
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
      });

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: txHash });
      }

      // 4. Sync metadata to backend (strictly without raw PIN)
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

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
          confirmation_hash: confirmationHash,
        }),
      }).catch((syncErr) => console.warn("Sync warning:", syncErr));

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