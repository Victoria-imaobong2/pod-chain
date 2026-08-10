"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useConfirmDeliveryHandler } from "../../../hooks/useConfirmDeliveryHandler";

interface LocalParcel {
  id: string;
  hash?: string;
  status?: string;
}

export default function CourierScanPage() {
  const router = useRouter();
  const { handleConfirmDelivery, isConnected } = useConfirmDeliveryHandler();

  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error" | "info"; text: string } | null>({
    type: "info",
    text: "Align the receiver's QR code within the camera frame.",
  });
  const [scannedData, setScannedData] = useState<{ txHash: string; pin: string } | null>(null);

  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const processVerification = useCallback(
    async (txHash: string, pin: string) => {
      setStatusMsg({ type: "info", text: "QR detected! Submitting transaction to smart contract..." });

      try {
        const local: LocalParcel[] = JSON.parse(localStorage.getItem("pod_parcels") || "[]");
        const match = local.find((p) => p.hash && txHash.includes(p.hash.replace("...", "")));
        const numericId = match ? Number.parseInt(match.id.replace(/\D/g, ""), 10) : 1;

        const res = await handleConfirmDelivery(numericId, pin);

        if (res?.success) {
          setStatusMsg({
            type: "success",
            text: `Delivery confirmed! Payment released. Tx: ${res.txHash.substring(0, 10)}...`,
          });

          if (match) {
            const updated = local.map((p) =>
              p.id === match.id ? { ...p, status: "Delivered" } : p
            );
            localStorage.setItem("pod_parcels", JSON.stringify(updated));
          }

          setTimeout(() => {
            router.push("/courier");
          }, 2500);
        }
      } catch (err: unknown) {
        const error = err as Error;
        setStatusMsg({ type: "error", text: error.message || "On-chain verification failed." });
      }
    },
    [handleConfirmDelivery, router]
  );

  useEffect(() => {
    scannerRef.current = new Html5QrcodeScanner(
      "qr-reader-container",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    scannerRef.current.render(
      async (decodedText) => {
        if (decodedText.startsWith("POD_PARCEL:")) {
          const content = decodedText.replace("POD_PARCEL:", "");
          const [txHash, pin] = content.split("|PIN:");

          if (txHash && pin) {
            setScannedData({ txHash, pin });
            if (scannerRef.current) {
              scannerRef.current.clear().catch(console.error);
            }
            await processVerification(txHash, pin);
          } else {
            setStatusMsg({ type: "error", text: "Invalid QR code payload format." });
          }
        } else {
          setStatusMsg({ type: "error", text: "Unrecognized QR code." });
        }
      },
      () => {
        // Frame scanning errors ignored
      }
    );

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [processVerification]);

  const getStatusBadgeStyle = (type?: "success" | "error" | "info") => {
    if (type === "success") return "bg-green-50 text-green-800 border-green-200";
    if (type === "error") return "bg-red-50 text-red-800 border-red-200";
    return "bg-blue-50 text-blue-800 border-blue-200";
  };

  return (
    <div className="max-w-md mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">📷 Scan Delivery QR</h1>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-teal-600 hover:underline font-medium cursor-pointer"
        >
          ← Back
        </button>
      </div>

      {!isConnected && (
        <div className="p-3 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-sm">
          Please connect your courier Web3 wallet before scanning.
        </div>
      )}

      <div className="bg-white border rounded-xl p-4 shadow-sm">
        <div id="qr-reader-container" className="w-full overflow-hidden rounded-lg"></div>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-lg text-sm font-medium text-center border ${getStatusBadgeStyle(
            statusMsg.type
          )}`}
        >
          {statusMsg.text}
        </div>
      )}

      {scannedData && (
        <div className="text-xs text-gray-500 font-mono text-center space-y-1 bg-gray-50 p-3 rounded">
          <p>Tx Hash: {scannedData.txHash.substring(0, 16)}...</p>
          <p>Extracted PIN: ***{scannedData.pin.slice(-2)}</p>
        </div>
      )}
    </div>
  );
}