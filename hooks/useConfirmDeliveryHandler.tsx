"use client";

import { useState } from "react";
import { API_BASE_URL } from "@/lib/config";

export function useConfirmDeliveryHandler() {
  const [isPending, setIsPending] = useState(false);
  
  const handleConfirmDelivery = async (
    parcelId: number | string,
    pin: string
  ): Promise<{ success: boolean; txHash?: string; durationSec?: string }> => {
    setIsPending(true);
    const t0 = performance.now();

    try {
      const baseUrl = API_BASE_URL || "https://podchain-backend.onrender.com";
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("token") || localStorage.getItem("access_token")
          : null;

      const res = await fetch(
        `${baseUrl}/api/v1/parcels/${parcelId}/confirm-delivery`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            delivery_code: pin,
            pin: pin,
          }),
        }
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.detail ||
            errorData.message ||
            `Verification failed with status ${res.status}`
        );
      }

      const data = await res.json();

      return {
        success: true,
        txHash: data.tx_hash || `sol-verified-${Date.now()}`,
        durationSec: ((performance.now() - t0) / 1000).toFixed(2),
      };
    } catch (err: unknown) {
      console.error("Courier delivery confirmation failed:", err);
      const message =
        err instanceof Error ? err.message : "Failed to confirm delivery.";
      throw new Error(message);
    } finally {
      setIsPending(false);
    }
  };

  return {
    handleConfirmDelivery,
    isPending,
  };
}