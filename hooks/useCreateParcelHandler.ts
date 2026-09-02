"use client";

import { useState } from "react";

export function useCreateParcelHandler() {
  const [loading, setLoading] = useState(false);

  const handleCreateParcel = async (
    formData: {
      receiverEmail: string;
      receiverPhone: string;
      contentsName: string;
      destinationAddress: string;
      courierFeeEth: string; // Transacted as SOL
    },
    file?: File | null
  ) => {
    setLoading(true);
    const baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || "https://podchain-backend.onrender.com";

    try {
      // 1. Optional IPFS Upload
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

      // 2. Generate OTP & confirmation hash from backend
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
      const trackingNumber = `POD-${Date.now().toString().slice(-6)}`;

      // 3. Relay transaction on-chain via backend keypair (no client wallet needed)
      const relayRes = await fetch("/api/relay-tx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackingNumber,
          receiverPhone: formData.receiverPhone,
          destinationAddress: formData.destinationAddress,
          contentsName: formData.contentsName,
          confirmationHash,
          ipfsHash: ipfsCid,
          feeSol: formData.courierFeeEth || "0.001",
        }),
      });

      if (!relayRes.ok) {
        const relayErr = await relayRes.json();
        throw new Error(relayErr.error || "Failed on-chain transaction");
      }

      const relayData = await relayRes.json();
      const txSignature = relayData.txHash;

      // 4. Sync to backend database so it reflects in the dashboard
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("token") || localStorage.getItem("access_token")
          : null;

      const syncRes = await fetch(`${baseUrl}/api/v1/parcels/sync`, {
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

      if (!syncRes.ok) {
        const syncErr = await syncRes.text();
        console.warn("Backend database sync failed:", syncErr);
        throw new Error(`Parcel saved on-chain, but failed to sync database: ${syncErr}`);
      }

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