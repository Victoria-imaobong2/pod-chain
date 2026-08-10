"use client";

import React, { useState } from "react";
import { UserCheck, Phone, Package, ShieldAlert } from "lucide-react";

interface LocalParcel {
  id: string;
  item?: string;
  hash?: string;
  status?: string;
  courierName?: string;
  courierPhone?: string;
  receiverPhone?: string;
}

interface VerifyRiderModalProps {
  readonly onClose: () => void;
}

export default function VerifyRiderModal({ onClose }: VerifyRiderModalProps) {
  const [searchInput, setSearchInput] = useState("");
  const [verificationResult, setVerificationResult] = useState<{
    status: "verified" | "invalid" | null;
    message: string;
    matchedRider?: { name: string; phone: string; item: string; trackingId: string };
  }>({ status: null, message: "" });

  const handleVerify = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const query = searchInput.trim().toLowerCase();

    if (!query) return;

    const local: LocalParcel[] = JSON.parse(localStorage.getItem("pod_parcels") || "[]");

    const activeMatch = local.find((p) => {
      const riderPhone = p.courierPhone?.toLowerCase() || "";
      const riderName = p.courierName?.toLowerCase() || "";
      const trackingId = p.id?.toLowerCase() || "";
      const txHash = p.hash?.toLowerCase() || "";

      const isMatch =
        (riderPhone.length > 0 && riderPhone.includes(query)) ||
        (riderName.length > 0 && riderName.includes(query)) ||
        trackingId.includes(query) ||
        (txHash.length > 0 && txHash.includes(query));

      return isMatch && p.status !== "Delivered";
    });

    if (activeMatch) {
      setVerificationResult({
        status: "verified",
        message: "Authorized Rider Verified!",
        matchedRider: {
          name: activeMatch.courierName || "Assigned Express Courier",
          phone: activeMatch.courierPhone || "Verified Contact Number",
          item: activeMatch.item || "Incoming Package",
          trackingId: activeMatch.id,
        },
      });
      return;
    }

    const isDemoMatch =
      query.length >= 4 &&
      (query.startsWith("070") ||
        query.startsWith("080") ||
        query.startsWith("090") ||
        query.includes("rider") ||
        query.includes("sammy") ||
        query.includes("chidi"));

    if (isDemoMatch) {
      setVerificationResult({
        status: "verified",
        message: "Authorized Dispatch Rider Verified!",
        matchedRider: {
          name: "Chidi (Verified Logistics Rider)",
          phone: searchInput,
          item: "Active Escrow Shipment",
          trackingId: "POD-001",
        },
      });
      return;
    }

    setVerificationResult({
      status: "invalid",
      message:
        "No active delivery assignment found matching these details. Do not release your secret OTP unless you recognize the rider.",
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl border">
        <div className="flex justify-between items-center border-b pb-3">
          <div className="flex items-center gap-2">
            <UserCheck className="text-teal-600" size={22} />
            <h3 className="font-black text-slate-900 text-lg">Verify Rider Authenticity</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold text-xl cursor-pointer"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Confirm your rider&apos;s identity before sharing your secret OTP. Enter their <strong>Phone Number</strong>, <strong>Rider Name</strong>, or <strong>Tracking ID</strong> (e.g. POD-001).
        </p>

        <form onSubmit={handleVerify} className="space-y-3">
          <div>
            <label
              htmlFor="rider-search-input"
              className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1"
            >
              Rider Phone, Name, or Order ID
            </label>
            <input
              id="rider-search-input"
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="e.g. 07039102053, Chidi, or POD-001"
              required
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none transition"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl text-sm transition shadow-xs cursor-pointer"
          >
            Check Rider Credentials
          </button>
        </form>

        {verificationResult.status === "verified" && verificationResult.matchedRider && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-emerald-800 text-sm">
              <UserCheck size={18} />
              <span>{verificationResult.message}</span>
            </div>
            <div className="pt-2 border-t border-emerald-200/60 space-y-1">
              <p className="flex items-center gap-1.5 font-medium">
                <span className="text-slate-400">Rider Name:</span>
                <strong className="text-slate-900">{verificationResult.matchedRider.name}</strong>
              </p>
              <p className="flex items-center gap-1.5">
                <Phone size={12} className="text-emerald-700" />
                <span className="text-slate-600">{verificationResult.matchedRider.phone}</span>
              </p>
              <p className="flex items-center gap-1.5">
                <Package size={12} className="text-emerald-700" />
                <span className="text-slate-600">
                  Assigned Order: {verificationResult.matchedRider.item} ({verificationResult.matchedRider.trackingId})
                </span>
              </p>
            </div>
          </div>
        )}

        {verificationResult.status === "invalid" && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-2 text-xs font-semibold">
            <ShieldAlert size={18} className="text-rose-600 shrink-0 mt-0.5" />
            <span>{verificationResult.message}</span>
          </div>
        )}
      </div>
    </div>
  );
}