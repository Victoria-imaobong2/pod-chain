"use client";

import { useState } from "react";
import {
  useWriteContract,
  useAccount,
  usePublicClient,
} from "wagmi";
import { parseEther } from "viem";

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
  courierAddress: string;
};

export function useCreateParcelHandler() {
  const { writeContractAsync, isPending } = useWriteContract();
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCreateParcel = async (
    formData: ParcelFormData,
    selectedFile: File | null
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
    // COURIER ADDRESS CHECK
    // --------------------------------------------------

    if (!formData.courierAddress?.trim()) {
      const msg = "Please enter the courier wallet address.";
      setErrorMsg(msg);
      throw new Error(msg);
    }

    const courierAddress = formData.courierAddress.trim();

    if (!courierAddress.startsWith("0x")) {
      const msg =
        "Invalid courier wallet address. It must start with 0x.";
      setErrorMsg(msg);
      throw new Error(msg);
    }

    if (courierAddress.length !== 42) {
      const msg =
        "Invalid courier wallet address. A wallet address must contain 42 characters.";
      setErrorMsg(msg);
      throw new Error(msg);
    }

    const formattedCourier =
      courierAddress as HexAddress;

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
      // CREATE BLOCKCHAIN ESCROW
      // ------------------------------------------------

      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: DeliveryEscrowABI,
        functionName: "createParcel",

        // Your contract currently expects:
        // createParcel(
        //   string itemDescription,
        //   string receiverPhone,
        //   address courier
        // )

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        args: [
          formData.contentsName,
          formData.receiverPhone,
          formattedCourier,
        ] as any,

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
        pin: null,
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