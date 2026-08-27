"use client";

import { useState } from "react";
import {
  useWriteContract,
  useAccount,
  usePublicClient,
} from "wagmi";
import { parseEther } from "viem";

import { DeliveryEscrowABI } from "../lib/abi/DeliveryEscrow";
import { API_BASE_URL } from "../lib/config";

type HexAddress = `0x${string}`;

const CONTRACT_ADDRESS =
  "0x2279b7a0a67db372996a5fab50d91eaa73d2ebe6" as HexAddress;

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
    selectedFile: File | null
  ) => {
    setErrorMsg(null);

    // ============================================================
    // 1. CHECK WALLET
    // ============================================================

    if (!isConnected || !address) {
      const msg = "Please connect your wallet first.";
      setErrorMsg(msg);
      throw new Error(msg);
    }

    // ============================================================
    // 2. CHECK DELIVERY FEE
    // ============================================================

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

    // ============================================================
    // 3. CHECK PACKAGE CONTENT
    // ============================================================

    if (!formData.contentsName.trim()) {
      const msg = "Please enter the package contents.";
      setErrorMsg(msg);
      throw new Error(msg);
    }

    // ============================================================
    // 4. CHECK RECEIVER PHONE
    // ============================================================

    if (!formData.receiverPhone.trim()) {
      const msg = "Please enter the receiver's phone number.";
      setErrorMsg(msg);
      throw new Error(msg);
    }

    // ============================================================
    // 5. CHECK DESTINATION
    // ============================================================

    if (!formData.destinationAddress.trim()) {
      const msg = "Please enter the receiver's destination address.";
      setErrorMsg(msg);
      throw new Error(msg);
    }

    // ============================================================
    // 6. CHECK FILE
    // ============================================================

    if (!selectedFile) {
      const msg = "Please upload a package proof photo.";
      setErrorMsg(msg);
      throw new Error(msg);
    }

    // ============================================================
    // 7. CHECK AUTH TOKEN  (must run BEFORE any blockchain spend)
    // ============================================================
    //
    // The JWT is required for STEP 7 (PostgreSQL sync). We read it here,
    // up front, so we never charge the user gas for the on-chain escrow
    // (STEP 3) only to fail afterwards because they are not logged in.

    const token = localStorage.getItem("token");

    if (!token) {
      const msg =
        "You are not logged in. Please log in again before creating a parcel.";
      setErrorMsg(msg);
      throw new Error(msg);
    }

    try {
      // ============================================================
      // STEP 1 — UPLOAD PACKAGE IMAGE TO IPFS
      // ============================================================

      console.log("========================================");
      console.log("STEP 1: Uploading package proof to IPFS");
      console.log("========================================");

      const ipfsFormData = new FormData();

      ipfsFormData.append("file", selectedFile);

      const ipfsResponse = await fetch("/api/ipfs", {
        method: "POST",
        body: ipfsFormData,
      });

      if (!ipfsResponse.ok) {
        let errorMessage =
          "Failed to upload package proof to IPFS.";

        try {
          const errorData = await ipfsResponse.json();

          if (errorData?.error) {
            errorMessage = errorData.error;
          }
        } catch {
          // Ignore JSON parsing error
        }

        throw new Error(errorMessage);
      }

      const ipfsData = await ipfsResponse.json();

      const ipfsHash = ipfsData?.IpfsHash;

      if (!ipfsHash || typeof ipfsHash !== "string") {
        throw new Error(
          "Pinata upload succeeded but no IPFS CID was returned."
        );
      }

      console.log("IPFS upload successful.");
      console.log("IPFS CID:", ipfsHash);

      // ============================================================
      // STEP 2 — GENERATE DELIVERY OTP
      // ============================================================

      console.log("========================================");
      console.log("STEP 2: Generating delivery OTP");
      console.log("========================================");

      const otpResponse = await fetch(
        `${API_BASE_URL}/api/v1/parcels/generate-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            receiver_email: formData.receiverEmail,
            receiver_phone: formData.receiverPhone,
          }),
        }
      );

      if (!otpResponse.ok) {
        const errorText = await otpResponse.text();

        throw new Error(
          `Failed to generate delivery OTP: ${errorText}`
        );
      }

      const otpData = await otpResponse.json();

      const confirmationHash = otpData?.confirmationHash;

      if (
        typeof confirmationHash !== "string" ||
        !confirmationHash.startsWith("0x") ||
        confirmationHash.length !== 66
      ) {
        throw new Error(
          "Invalid bytes32 confirmation hash received from backend."
        );
      }

      console.log("OTP hash generated successfully.");
      console.log("Confirmation hash:", confirmationHash);

      // ============================================================
      // STEP 3 — CREATE BLOCKCHAIN ESCROW
      // ============================================================

      console.log("========================================");
      console.log("STEP 3: Creating blockchain escrow");
      console.log("========================================");

      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: DeliveryEscrowABI,
        functionName: "createParcel",

        args: [
          formData.contentsName,
          formData.receiverPhone,
          formData.destinationAddress,
          confirmationHash as `0x${string}`,
          ipfsHash,
        ],

        value,
      });

      console.log("Blockchain transaction submitted:");
      console.log(txHash);

      // ============================================================
      // STEP 4 — WAIT FOR BLOCKCHAIN CONFIRMATION
      // ============================================================

      console.log("========================================");
      console.log("STEP 4: Waiting for blockchain confirmation");
      console.log("========================================");

      if (!publicClient) {
        throw new Error(
          "Blockchain client is unavailable."
        );
      }

      const receipt =
        await publicClient.waitForTransactionReceipt({
          hash: txHash,
        });

      console.log(
        "Blockchain transaction confirmed.",
        receipt
      );

      // ============================================================
      // STEP 5 — AUTH TOKEN
      // ============================================================
      // Already validated up front (before the blockchain spend), so the
      // `token` from the top of this function is guaranteed to be present.

      console.log("JWT token found.");

      // ============================================================
      // STEP 6 — GENERATE TRACKING NUMBER
      // ============================================================

      const trackingNumber =
        `POD-${Date.now()}-${Math.floor(
          Math.random() * 10000
        )
          .toString()
          .padStart(4, "0")}`;

      console.log(
        "Generated tracking number:",
        trackingNumber
      );

      // ============================================================
      // STEP 7 — SYNC BLOCKCHAIN TRANSACTION TO POSTGRESQL
      // ============================================================

      console.log("========================================");
      console.log("STEP 7: Syncing parcel to PostgreSQL");
      console.log("========================================");

      const syncResponse = await fetch(
        `${API_BASE_URL}/api/v1/parcels/sync`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            tracking_number: trackingNumber,

            contents_name:
              formData.contentsName,

            receiver_email:
              formData.receiverEmail,

            receiver_phone:
              formData.receiverPhone,

            destination_address:
              formData.destinationAddress,

            pin: "000000",

            ipfs_hash: ipfsHash,

            tx_hash: txHash,

            sender_wallet: address,
          }),
        }
      );

      // ============================================================
      // STEP 8 — CHECK POSTGRESQL RESPONSE
      // ============================================================

      if (!syncResponse.ok) {
        const errorText =
          await syncResponse.text();

        console.error(
          "PostgreSQL sync failed:",
          errorText
        );

        // A 401 here means the JWT was present but rejected by the backend
        // (expired or invalid signature) — this is the real "session expired".
        if (syncResponse.status === 401) {
          throw new Error(
            "Your login session has expired. Please log in again. " +
              "Note: your on-chain escrow already succeeded (tx " +
              `${txHash}); re-create the parcel after logging in.`
          );
        }

        throw new Error(
          `Blockchain transaction succeeded, but PostgreSQL synchronization failed: ${errorText}`
        );
      }

      const syncData =
        await syncResponse.json();

      console.log(
        "========================================"
      );
      console.log(
        "POSTGRESQL SYNC SUCCESSFUL"
      );
      console.log(
        "========================================"
      );

      console.log(
        "Database response:",
        syncData
      );

      // ============================================================
      // STEP 9 — RETURN SUCCESS
      // ============================================================

      return {
        success: true,

        txHash,

        ipfsHash,

        trackingNumber,

        databaseParcel:
          syncData?.parcel ?? null,
      };
    } catch (err: unknown) {
      console.error(
        "========================================"
      );

      console.error(
        "CREATE PARCEL ERROR"
      );

      console.error(
        "========================================"
      );

      console.error(err);

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