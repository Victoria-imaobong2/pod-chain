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
  const { isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
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
      if (!isConnected) {
        throw new Error("Wallet is not connected. Please click Connect Wallet first.");
      }

      // 1. IPFS Upload
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
          console.warn("IPFS upload fallback:", ipfsErr);
        }
      }

      // 2. Generate OTP & confirmation hash
      const otpRes = await fetch(`${baseUrl}/api/v1/parcels/generate-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiver_email: formData.receiverEmail,
          receiver_phone: formData.receiverPhone,
        }),
      });

      if (!otpRes.ok) {
        const errText = await otpRes.text();
        throw new Error(`OTP Generation Failed: ${errText}`);
      }

      const { confirmationHash, rawPin } = await otpRes.json();

      // Ensure 32-byte hex hash format with exact 66 characters
      let formattedHash = confirmationHash || "";
      if (!formattedHash.startsWith("0x")) {
        formattedHash = `0x${formattedHash}`;
      }
      if (formattedHash.length < 66) {
        formattedHash = formattedHash.padEnd(66, "0");
      } else if (formattedHash.length > 66) {
        formattedHash = formattedHash.slice(0, 66);
      }

      let txHash: `0x${string}`;

      // 3. Contract Write with direct backend relay fallback
      try {
        const bountyWei = parseEther(formData.courierFeeEth || "0.001");
        txHash = await writeContractAsync({
          address: CONTRACT_ADDRESS,
          abi: ESCROW_CREATE_ABI,
          functionName: "createParcel",
          args: [
            formData.receiverPhone,
            formData.destinationAddress,
            formData.contentsName,
            formattedHash as `0x${string}`,
            ipfsCid,
          ],
          value: bountyWei,
          gas: BigInt(500000),
        });

        if (publicClient) {
          await publicClient.waitForTransactionReceipt({ hash: txHash });
        }
      } catch (clientErr) {
        console.warn("MetaMask client broadcast issue, using relay route...", clientErr);

        const relayRes = await fetch("/api/relay-tx", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            receiverPhone: formData.receiverPhone,
            destinationAddress: formData.destinationAddress,
            contentsName: formData.contentsName,
            confirmationHash: formattedHash,
            ipfsHash: ipfsCid,
            feeEth: formData.courierFeeEth,
          }),
        });

        if (!relayRes.ok) {
          const relayErr = await relayRes.json();
          throw new Error(relayErr.error || "Failed on-chain transaction");
        }

        const relayData = await relayRes.json();
        txHash = relayData.txHash;
      }

      // 4. Sync to PostgreSQL backend
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
          delivery_code: rawPin,
          pin_code: rawPin,
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