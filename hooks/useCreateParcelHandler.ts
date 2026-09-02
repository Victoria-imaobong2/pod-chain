"use client";

import { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

// Optional fallback escrow vault address or program ID
const ESCROW_PROGRAM_OR_VAULT = new PublicKey(
  process.env.NEXT_PUBLIC_SOLANA_PROGRAM_ID ||
    "11111111111111111111111111111111"
);

export function useCreateParcelHandler() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected } = useWallet();
  const [loading, setLoading] = useState(false);

  const handleCreateParcel = async (
    formData: {
      receiverEmail: string;
      receiverPhone: string;
      contentsName: string;
      destinationAddress: string;
      courierFeeEth: string; // Used as courierFeeSol
    },
    file?: File | null
  ) => {
    setLoading(true);
    const baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || "https://podchain-backend.onrender.com";

    try {
      if (!connected || !publicKey) {
        throw new Error("Solana wallet is not connected. Please connect Phantom first.");
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

      // 3. Build & Sign Solana Transaction
      const lamports = Math.round(
        parseFloat(formData.courierFeeEth || "0.001") * LAMPORTS_PER_SOL
      );

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: ESCROW_PROGRAM_OR_VAULT,
          lamports: lamports > 0 ? lamports : 1_000_000, // 0.001 SOL fallback
        })
      );

      const latestBlockhash = await connection.getLatestBlockhash("confirmed");
      transaction.recentBlockhash = latestBlockhash.blockhash;
      transaction.feePayer = publicKey;

      let txSignature: string;

      try {
        txSignature = await sendTransaction(transaction, connection);
        await connection.confirmTransaction(
          {
            signature: txSignature,
            blockhash: latestBlockhash.blockhash,
            lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
          },
          "confirmed"
        );
      } catch (signErr) {
        console.warn("Client signature failed, trying backend relay...", signErr);

        // Fallback to backend relay if client refuses/fails
        const relayRes = await fetch("/api/relay-tx", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            receiverPhone: formData.receiverPhone,
            destinationAddress: formData.destinationAddress,
            contentsName: formData.contentsName,
            confirmationHash,
            ipfsHash: ipfsCid,
            feeSol: formData.courierFeeEth,
            senderPublicKey: publicKey.toBase58(),
          }),
        });

        if (!relayRes.ok) {
          const relayErr = await relayRes.json();
          throw new Error(relayErr.error || "Failed on-chain transaction");
        }

        const relayData = await relayRes.json();
        txSignature = relayData.txHash;
      }

      // 4. Sync to Backend Database
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
          tx_hash: txSignature,
        }),
      });

      return {
        success: true,
        txHash: txSignature,
        trackingNumber,
      };
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to create parcel on Solana";
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