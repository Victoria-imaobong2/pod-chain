"use client";

import { useState } from "react";
import {
  useWriteContract,
  useAccount,
  usePublicClient,
} from "wagmi";
import { parseEther, keccak256, toBytes } from "viem";

import { DeliveryEscrowABI } from "../lib/abi/DeliveryEscrow";

type HexAddress = `0x${string}`;

const CONTRACT_ADDRESS =
  "0x5fbdb2315678afecb367f032d93f642f64180aa3" as HexAddress;

type ParcelFormData = {
  receiverEmail: string;
  receiverPhone: string;
  courierFeeEth: string;
  ipfsHash: string;
  contentsName: string;
  destinationAddress: string;
};

export function useCreateParcelHandler() {
  const { writeContractAsync, isPending } = useWriteContract();
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCreateParcel = async (
    formData: ParcelFormData,
    selectedFile: File | null,
  ) => {
    setErrorMsg(null);

    // --------------------------------------------------
    // WALLET CHECK
    // --------------------------------------------------

    if (!isConnected || !address) {
      const msg = "Please connect your wallet first.";
      setErrorMsg(msg);
      throw new Error(msg);
    }

    // --------------------------------------------------
    // AMOUNT CHECK
    // --------------------------------------------------

    if (!formData.courierFeeEth?.trim()) {
      const msg = "Please enter the courier delivery fee.";
      setErrorMsg(msg);
      throw new Error(msg);
    }

    let value: bigint;

    try {
      value = parseEther(formData.courierFeeEth);
    } catch {
      const msg = "Please enter a valid ETH amount.";
      setErrorMsg(msg);
      throw new Error(msg);
    }

    if (value <= 0n) {
      const msg = "Courier delivery fee must be greater than 0.";
      setErrorMsg(msg);
      throw new Error(msg);
    }

    // --------------------------------------------------
    // CONTENTS CHECK
    // --------------------------------------------------

    if (!formData.contentsName.trim()) {
      const msg = "Please enter the package contents.";
      setErrorMsg(msg);
      throw new Error(msg);
    }

    // --------------------------------------------------
    // FILE CHECK
    // --------------------------------------------------

    if (!selectedFile) {
      const msg = "Please upload a package proof photo.";
      setErrorMsg(msg);
      throw new Error(msg);
    }

    try {
      // ------------------------------------------------
      // FETCH OTP HASH FROM BACKEND & EMAIL RECEIVER
      // ------------------------------------------------
      const otpResponse = await fetch("http://127.0.0.1:8000/api/parcels/generate-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiver_email: formData.receiverEmail,
          receiver_phone: formData.receiverPhone,
        }),
      });

      if (!otpResponse.ok) {
        throw new Error("Failed to generate delivery OTP from backend.");
      }

  const data = await otpResponse.json();

// Hash the SAME OTP that will be sent to the receiver's email.
const confirmationHash = data.confirmationHash;

if (
  typeof confirmationHash !== "string" ||
  !confirmationHash.startsWith("0x") ||
  confirmationHash.length !== 66 // '0x' + 64 hex chars = 66 chars
) {
  console.error("Invalid confirmationHash received:", confirmationHash);
  throw new Error(
    "Invalid bytes32 hash format received from server. Expected a 0x-prefixed 32-byte hex string."
  );   
 }

      // ------------------------------------------------
      // CREATE BLOCKCHAIN ESCROW
      // ------------------------------------------------

      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: DeliveryEscrowABI,
        functionName: "createParcel",

        args: [
          formData.contentsName,
          formData.receiverPhone,
          formData.destinationAddress,
          confirmationHash as `0x${string}`, // Ensure it's treated as a bytes32
          formData.ipfsHash,

        ],

        value,
      });

      // ------------------------------------------------
      // WAIT FOR CONFIRMATION
      // ------------------------------------------------

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({
          hash: txHash,
        });
      }

      return {
        success: true,
        txHash,
        ipfsHash: formData.ipfsHash || null,
      };
    } catch (err: unknown) {
      console.error("Create parcel error:", err);

      const error = err as {
        shortMessage?: string;
        message?: string;
      };

      const message =
        error?.shortMessage ||
        error?.message ||
        "Failed to create escrow parcel.";

      setErrorMsg(message);

      throw new Error(message);
    }
  };

  return {
    handleCreateParcel,
    isPending,
    isConnected,
    errorMsg,
  };
}