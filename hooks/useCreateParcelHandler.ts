import { useState } from "react";
import { useAccount, useWriteContract, usePublicClient } from "wagmi";
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
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const [loading, setLoading] = useState(false);

  const handleCreateParcel = async (formData: {
    receiverEmail: string;
    receiverPhone: string;
    contentsName: string;
    destinationAddress: string;
    courierFeeEth: string;
  }) => {
    setLoading(true);
    const baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || "https://podchain-backend.onrender.com";

    try {
      // 1. Generate OTP and keccak256 hash via backend
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

      // 2. Format Hash for Viem / Solidity bytes32
      const formattedHash = (
        confirmationHash.startsWith("0x")
          ? confirmationHash
          : `0x${confirmationHash}`
      ) as `0x${string}`;

      const bountyWei = parseEther(formData.courierFeeEth || "0.001");
      const ipfsCid = "QmDefaultPlaceholderHash";

      // 3. Execute contract transaction
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

      // 4. Sync metadata to backend
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
    } catch (err: any) {
      console.error("Create parcel error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { 
    handleCreateParcel, 
    loading, 
    isPending: loading};
}