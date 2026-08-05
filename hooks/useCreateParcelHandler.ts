"use client";

import { useWriteContract, useAccount, usePublicClient } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useRouter } from "next/navigation";
import { keccak256, encodePacked, parseEther } from "viem";
import { DeliveryEscrowABI } from "../lib/abi/DeliveryEscrow";

const CONTRACT_ADDRESS = "0x5fbdb2315678afecb367f032d93f642f64180aa3";

export interface ParcelFormInputs {
  receiverEmail: string;
  receiverPhone: string;
  courierFeeEth: string;
  contentsName?: string;
  destinationAddress?: string;
  ipfsHash?: string;
  receiverAddress?: string;
}

export function useCreateParcelHandler() {
  const { writeContractAsync, isPending: isSubmittingTx } = useWriteContract();
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const publicClient = usePublicClient();
  const router = useRouter();

  const handleCreateParcel = async (
    data: ParcelFormInputs,
    file?: File | null
  ) => {
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

      // 1. Upload to Pinata IPFS if image provided
      if (file) {
        const formData = new FormData();
        formData.append("file", file);

        const pinataRes = await fetch("/api/ipfs", {
          method: "POST",
          body: formData,
        });

        if (!pinataRes.ok) {
          throw new Error("Failed to upload package photo to Pinata IPFS");
        }

        const pinataData = await pinataRes.json();
        targetIpfsHash = pinataData.ipfsHash || pinataData.IpfsHash;
      }

      // 2. Generate 6-digit PIN & hash
      const array = new Uint32Array(1);
      crypto.getRandomValues(array);
      const rawPin = (100000 + (array[0] % 900000)).toString();

      const confirmationHash = keccak256(encodePacked(["string"], [rawPin]));

      const receiverAddress =
        data.receiverAddress ||
        address ||
        "0x0000000000000000000000000000000000000000";

      // 3. Smart Contract Call
      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: DeliveryEscrowABI,
        functionName: "createParcel",
        args: [
          receiverAddress as `0x${string}`,
          confirmationHash,
          targetIpfsHash,
        ],
        value: parseEther(data.courierFeeEth || "0"),
        gas: BigInt(500000),
      });

      console.log("Transaction sent! Waiting for confirmation... Hash:", txHash);

      // Declare onChainParcelId with fallback default
      let onChainParcelId = Date.now();

      if (publicClient) {
        try {
          const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
          if (receipt && receipt.logs && receipt.logs.length > 0 && receipt.logs[0].topics[1]) {
            onChainParcelId = parseInt(receipt.logs[0].topics[1], 16);
          }
        } catch (receiptErr) {
          console.warn("Could not parse transaction receipt logs, using fallback ID:", receiptErr);
        }
      }

      // 4. FastAPI Notification Request
      const notificationPayload = {
        parcelId: onChainParcelId,
        receiverEmail: data.receiverEmail,
        receiverPhone: data.receiverPhone,
        pin: rawPin,
        ipfsHash: targetIpfsHash,
        txHash: txHash,
        senderAddress: address,
        contentsName: data.contentsName || "General Goods",
        destinationAddress: data.destinationAddress || "Standard Delivery",
      };

      const backendResponse = await fetch("http://localhost:8000/api/v1/parcels/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notificationPayload),
      });

      if (!backendResponse.ok) {
        const rawError = await backendResponse.text().catch(() => "");
        let detail = rawError;
        try {
          detail = JSON.parse(rawError).detail || rawError;
        } catch {
          // response was not JSON; keep raw text
        }
        console.error("FastAPI Notification Error:", backendResponse.status, detail);
        throw new Error(detail || `Failed to send notification (${backendResponse.status})`);
      }

      const backendData = await backendResponse.json();

      // 5. Sync LocalStorage for SME Dashboard UI
      const existing = JSON.parse(localStorage.getItem("pod_parcels") || "[]");
      const nextIdNumber = existing.length + 1;
      const formattedId = `POD-${String(nextIdNumber).padStart(3, "0")}`;

      const newParcelEntry = {
        id: formattedId,
        item: data.contentsName || "General Goods",
        address: data.destinationAddress || "In Transit",
        timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
        status: "Created",
        hash: `${txHash.substring(0, 6)}...${txHash.substring(txHash.length - 4)}`,
      };

      localStorage.setItem("pod_parcels", JSON.stringify([newParcelEntry, ...existing]));

      return {
        success: true,
        txHash,
        ipfsHash: targetIpfsHash,
        pin: rawPin,
        qrCodeUrl: backendData.qrCodeUrl,
      };
    } catch (error) {
      console.error("Error creating parcel:", error);
      throw error;
    }
  };

  return { handleCreateParcel, isSubmittingTx, isConnected, address };
}