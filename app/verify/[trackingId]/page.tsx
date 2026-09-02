"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Clock,
  ShieldCheck,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { API_BASE_URL } from "@/lib/config";

interface ParcelData {
  id: number;
  tracking_number: string;
  contents_name: string;
  destination_address: string;
  status: string;
  tx_hash: string | null;
  ipfs_hash: string | null;
  transaction_timestamp: string | null;
  delivery_proof_image_url: string | null;
  delivered_at: string | null;
}

export default function VerifyParcelPage() {
  const params = useParams();
  const router = useRouter();

  // Extract trackingId whether used as /verify?trackingId=... or /verify/[trackingId]
  const trackingNumber = (params?.trackingId as string) || "";

  const [parcel, setParcel] = useState<ParcelData | null>(null);
  const [pin, setPin] = useState("");
  const [fetching, setFetching] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const backendUrl = API_BASE_URL || "https://podchain-backend.onrender.com";

  // Fetch parcel details on mount
  useEffect(() => {
    async function loadParcel() {
      if (!trackingNumber) {
        setFetching(false);
        return;
      }

      try {
        setFetching(true);
        setError("");

        const res = await fetch(`${backendUrl}/api/v1/parcels`);
        if (!res.ok) throw new Error("Failed to reach logistics backend");

        const parcels: ParcelData[] = await res.json();
        const found = parcels.find(
          (p) =>
            p.tracking_number?.toLowerCase() === trackingNumber.toLowerCase()
        );

        if (!found) {
          setError(`No parcel found matching tracking ID: ${trackingNumber}`);
        } else {
          setParcel(found);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error loading parcel";
        setError(msg);
      } finally {
        setFetching(false);
      }
    }

    loadParcel();
  }, [trackingNumber, backendUrl]);

  // Handle PIN confirmation and image acceptance
  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parcel) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(
        `${backendUrl}/api/v1/parcels/${parcel.id}/confirm-delivery`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pin: pin.trim(),
            delivery_code: pin.trim(),
            delivery_proof_image_url:
              parcel.delivery_proof_image_url || parcel.ipfs_hash,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.detail || "PIN verification failed.");
      }

      setSuccessMessage("Delivery confirmed and handover completed successfully!");
      setParcel((prev) => (prev ? { ...prev, status: "Delivered" } : null));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Handover failed";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Derive gateway URL for IPFS hashes or plain URLs
  const rawImage = parcel?.delivery_proof_image_url || parcel?.ipfs_hash;
  const proofImageUrl = rawImage
    ? rawImage.startsWith("http")
      ? rawImage
      : `https://gateway.pinata.cloud/ipfs/${rawImage}`
    : null;

  const formattedTxTime = parcel?.transaction_timestamp
    ? new Date(parcel.transaction_timestamp).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Transaction Pending";

  if (fetching) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100">
        <Loader2 className="w-8 h-8 text-teal-400 animate-spin mb-3" />
        <p className="text-sm text-slate-400 font-medium">Retrieving on-chain parcel data...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <ShieldCheck className="text-teal-400" size={22} />
              Delivery Handover
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Tracking: <span className="font-mono text-teal-300 font-semibold">{trackingNumber || "N/A"}</span>
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
              parcel?.status === "Delivered"
                ? "bg-teal-950 text-teal-400 border border-teal-800"
                : "bg-amber-950 text-amber-300 border border-amber-800"
            }`}
          >
            {parcel?.status || "Unknown"}
          </span>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-rose-950/50 border border-rose-800/80 text-rose-300 text-xs sm:text-sm rounded-2xl flex items-center gap-3">
            <AlertTriangle className="shrink-0 text-rose-400" size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="p-4 bg-teal-950/50 border border-teal-800 text-teal-300 text-xs sm:text-sm rounded-2xl flex items-center gap-3">
            <CheckCircle2 className="shrink-0 text-teal-400" size={18} />
            <span>{successMessage}</span>
          </div>
        )}

        {parcel && (
          <>
            {/* Timestamp & On-Chain Details */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                  <Clock size={14} className="text-teal-400" />
                  Transaction Logged
                </span>
                <span className="font-mono text-slate-200 font-semibold">{formattedTxTime}</span>
              </div>

              {parcel.tx_hash && (
                <div className="flex items-center justify-between pt-1 border-t border-slate-700/40">
                  <span className="text-slate-400">Solana TX Hash:</span>
                  <a
                    href={`https://explorer.solana.com/tx/${parcel.tx_hash}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-400 hover:underline font-mono flex items-center gap-1 truncate max-w-[200px]"
                  >
                    {parcel.tx_hash.slice(0, 8)}...{parcel.tx_hash.slice(-8)}
                    <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>

            {/* Delivery Proof Picture Section */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <ImageIcon size={15} className="text-teal-400" />
                Proof of Delivery Photo
              </label>

              {proofImageUrl ? (
                <div className="relative w-full h-64 border border-slate-800 rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center">
                  <img
                    src={proofImageUrl}
                    alt="Proof of Delivery"
                    className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
                  />
                </div>
              ) : (
                <div className="p-8 border border-dashed border-slate-800 rounded-2xl text-center text-slate-500 text-xs">
                  No proof-of-delivery picture recorded yet.
                </div>
              )}
            </div>

            {/* Verification Form */}
            {parcel.status !== "Delivered" ? (
              <form onSubmit={handleConfirm} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Receiver 6-Digit Delivery PIN
                  </label>
                  <input
                    type="password"
                    required
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="••••••"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl font-mono text-center tracking-widest text-xl text-white focus:border-teal-500 outline-none transition-all"
                  />
                  <p className="text-[11px] text-slate-500 text-center">
                    Enter the code sent to your email to verify delivery and release funds.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting || pin.length < 4}
                  className="w-full bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Confirming Handover...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} />
                      Confirm Receipt & Picture
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="p-4 bg-teal-950/30 border border-teal-800/60 rounded-2xl text-center text-xs text-teal-300">
                This parcel has been confirmed and finalized.
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}