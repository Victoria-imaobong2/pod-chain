import { useState } from "react";
import { useAccount, useWalletClient, usePublicClient, useSwitchChain } from "wagmi";
import { createPublicClient, http, parseEther } from "viem";
import { baseSepolia } from "viem/chains";

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

const directPublicClient = createPublicClient({
  chain: baseSepolia,
  transport: http("https://sepolia.base.org"),
});

export function useCreateParcelHandler() {
  const { isConnected, address, chainId } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { switchChainAsync } = useSwitchChain();
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
      if (!isConnected || !address) {
        throw new Error("Wallet is not connected. Please click Connect Wallet first.");
      }

      // Auto-switch MetaMask to Base Sepolia if needed
      if (chainId !== baseSepolia.id && switchChainAsync) {
        try {
          await switchChainAsync({ chainId: baseSepolia.id });
        } catch (switchErr) {
          console.warn("Could not auto-switch chain:", switchErr);
        }
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
        if (!walletClient) {
          throw new Error("Wallet client not available");
        }

        const bountyWei = parseEther(formData.courierFeeEth || "0.001");

        txHash = await walletClient.writeContract({
          account: address,
          chain: baseSepolia,
          address: CONTRACT_ADDRESS,
          abi: ESCROW_CREATE_ABI,
          functionName: "createParcel",
          args: [
            String(formData.receiverPhone || ""),
            String(formData.destinationAddress || ""),
            String(formData.contentsName || ""),
            formattedHash as `0x${string}`,
            String(ipfsCid || ""),
          ],
          value: bountyWei,
        });

        const client = publicClient || directPublicClient;
        await client.waitForTransactionReceipt({ hash: txHash });
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