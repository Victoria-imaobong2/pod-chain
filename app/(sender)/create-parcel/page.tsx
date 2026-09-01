"use client";

import { useState } from "react";
import { useWriteContract, usePublicClient } from "wagmi";
import { parseEther } from "viem";

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

const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS ||
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  "0x5ec609ee5e21c8e00050228a1c51077589be5e39") as `0x${string}`;

export function useCreateParcelHandler() {
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const [loading, setLoading] = useState(false);

  const handleCreateParcel = async (
    formData: {
      receiverEmail: string;
      receiverPhone: string;
      contentsName: string;
      destinationAddress: string;
      courierFeeEth: string;
    },
    file?: File | null
  ) => {
    setLoading(true);
    const baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || "https://podchain-backend.onrender.com";

    try {
      // 1. Upload File to IPFS (if provided)
      let ipfsCid = "QmDefaultPlaceholderHash";
      if (file) {
        try {
          const fileData = new FormData();
          fileData.append("file", file);

          const ipfsRes = await fetch("/api/ipfs", {
            method: "POST",
            body: fileData,
          });

          if (ipfsRes.ok) {
            const ipfsJson = await ipfsRes.json();
            ipfsCid = ipfsJson.cid || ipfsJson.IpfsHash || ipfsJson.hash || ipfsCid;
          }
        } catch (ipfsErr) {
          console.warn("IPFS upload fallback to placeholder:", ipfsErr);
        }
      }

      // 2. Generate OTP and keccak256 hash via backend
      const otpRes = await fetch(`${baseUrl}/api/v1/parcels/generate-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiver_email: formData.receiverEmail,
        }),
      });

      if (!otpRes.ok) {
        throw new Error("Failed to generate delivery OTP on the backend");
      }

      const { confirmationHash, rawPin } = await otpRes.json();

      // 3. Format Hash for Viem / Solidity bytes32
      const formattedHash = (
        confirmationHash.startsWith("0x")
          ? confirmationHash
          : `0x${confirmationHash}`
      ) as `0x${string}`;

      const bountyWei = parseEther(formData.courierFeeEth || "0.001");

      // 4. Call createParcel with bytes32 hash and real IPFS CID
      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: ESCROW_CREATE_ABI,
        functionName: "createParcel",
        args: [
          formData.receiverPhone,
          formData.destinationAddress,
          formData.contentsName,
          formattedHash,
          ipfsCid,
        ],
        value: bountyWei,
      });

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: txHash });
      }

      // 5. Sync metadata to backend
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

      const trackingNumber = `POD-${Date.now().toString().slice(-6)}`;

      await fetch(`${baseUrl}/api/v1/parcels/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          tracking_number: trackingNumber,
          contents_name: formData.contentsName,
          receiver_email: formData.receiverEmail,
          receiver_phone: formData.receiverPhone,
          destination_address: formData.destinationAddress,
          pin: rawPin,
          ipfs_hash: ipfsCid,
          tx_hash: txHash,
        }),
      });

      return {
        success: true,
        txHash,
        trackingNumber,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create parcel";
      console.error("Create parcel error:", err);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  return {
    handleCreateParcel,
    loading,
    isPending: loading,
  };
}