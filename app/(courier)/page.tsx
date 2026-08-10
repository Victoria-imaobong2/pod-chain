"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Truck,
  QrCode,
  CheckCircle2,
  Clock,
  MapPin,
  X,
  ShieldCheck,
  AlertTriangle,
  Package,
} from "lucide-react";
import StatusBadge from "@/components/shared/StatusBadge";
import { useConfirmDeliveryHandler } from "../../hooks/useConfirmDeliveryHandler";

export interface CourierParcel {
  id: string;
  item?: string;
  address?: string;
  destinationAddress?: string;
  timestamp?: string;
  status?: "Created" | "InTransit" | "Delivered";
  hash?: string;
  sender?: string;
  pin?: string;
}

export default function CourierDashboard() {
  const router = useRouter();
  const { handleConfirmDelivery, isPending, isConnected } = useConfirmDeliveryHandler();

  const [parcels, setParcels] = useState<CourierParcel[]>(() => {
    if (typeof window === "undefined") return [];
    return JSON.parse(localStorage.getItem("pod_parcels") || "[]");
  });

  const [activeTab, setActiveTab] = useState<"active" | "completed">("active");
  const [selectedParcel, setSelectedParcel] = useState<CourierParcel | null>(null);
  const [pinInput, setPinInput] = useState("");
  const [statusMsg, setStatusMsg] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  const loadParcels = useCallback(() => {
    const localData = JSON.parse(localStorage.getItem("pod_parcels") || "[]");
    setParcels(localData);
  }, []);

  useEffect(() => {
    window.addEventListener("storage_updated", loadParcels);
    window.addEventListener("focus", loadParcels);

    return () => {
      window.removeEventListener("storage_updated", loadParcels);
      window.removeEventListener("focus", loadParcels);
    };
  }, [loadParcels]);

  const activeParcels = parcels.filter((p) => p.status !== "Delivered");
  const completedParcels = parcels.filter((p) => p.status === "Delivered");

  const handleVerifyDelivery = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedParcel) return;

    setStatusMsg({ type: "info", text: "Submitting proof of delivery on-chain..." });

    const numericId = Number.parseInt(selectedParcel.id.replace(/\D/g, "") || "1", 10);

    try {
      const res = await handleConfirmDelivery(numericId, pinInput);

      if (res?.success) {
        setStatusMsg({
          type: "success",
          text: `Delivery verified on-chain! Escrow payout released. Tx: ${res.txHash.substring(0, 10)}...`,
        });

        const updated = parcels.map((p) =>
          p.id === selectedParcel.id ? { ...p, status: "Delivered" as const } : p
        );

        localStorage.setItem("pod_parcels", JSON.stringify(updated));
        setParcels(updated);
        window.dispatchEvent(new Event("storage_updated"));

        setPinInput("");
        setTimeout(() => {
          setSelectedParcel(null);
          setStatusMsg(null);
        }, 2200);
      }
    } catch (err: unknown) {
      const error = err as Error;
      setStatusMsg({
        type: "error",
        text: error.message || "Invalid PIN code or smart contract execution failure.",
      });
    }
  };

  const getStatusBadgeStyle = (type?: "success" | "error" | "info") => {
    if (type === "success") return "bg-green-50 text-green-800 border-green-200";
    if (type === "error") return "bg-red-50 text-red-800 border-red-200";
    return "bg-blue-50 text-blue-800 border-blue-200";
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 pb-32 max-w-7xl mx-auto font-sans antialiased">
      <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-6 mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black tracking-tight text-slate-900">
              Courier Dispatch Terminal
            </h1>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
              Rider Mode
            </span>
          </div>
          <p className="text-slate-500 text-sm font-medium mt-0.5">
            Verify package handoffs, scan receiver QR codes, and trigger instant escrow payouts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/courier/scan")}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer text-sm"
          >
            <QrCode size={18} />
            <span>Launch Camera Scanner</span>
          </button>
        </div>
      </header>

      {!isConnected && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-900 text-sm">
          <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Web3 Wallet Disconnected</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Please connect your courier wallet in the top navigation bar to execute on-chain delivery verifications.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Tasks</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{activeParcels.length}</h3>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Truck size={24} />
          </div>
        </div>

        <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completed Handoffs</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{completedParcels.length}</h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 size={24} />
          </div>
        </div>

        <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Escrow Status</p>
            <h3 className="text-2xl font-black text-teal-600 mt-1">Verified</h3>
          </div>
          <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
            <ShieldCheck size={24} />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xs font-black tracking-widest text-slate-400 uppercase">
            Dispatched Parcel Queue
          </h2>

          <div className="flex gap-2 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab("active")}
              className={`px-3.5 py-1.5 rounded-full transition cursor-pointer ${
                activeTab === "active"
                  ? "bg-slate-900 text-white font-bold"
                  : "bg-slate-200 text-slate-600 hover:bg-slate-300"
              }`}
            >
              Pending Delivery ({activeParcels.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("completed")}
              className={`px-3.5 py-1.5 rounded-full transition cursor-pointer ${
                activeTab === "completed"
                  ? "bg-slate-900 text-white font-bold"
                  : "bg-slate-200 text-slate-600 hover:bg-slate-300"
              }`}
            >
              Completed ({completedParcels.length})
            </button>
          </div>
        </div>

        {(activeTab === "active" ? activeParcels : completedParcels).length === 0 ? (
          <div className="p-12 bg-white border border-slate-200 rounded-2xl text-center space-y-3 shadow-xs">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <Package size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">No shipments in this view</h3>
              <p className="text-slate-500 text-xs mt-1">
                There are currently no parcels matching this filter state.
              </p>
            </div>
          </div>
        ) : (
          (activeTab === "active" ? activeParcels : completedParcels).map((parcel, idx) => (
            <section
              key={parcel.id || idx}
              className="bg-white p-6 border border-slate-200 rounded-2xl shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition-all"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-900 text-lg">
                    {parcel.item || "General Freight Cargo"}
                  </span>
                  <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
                    {parcel.id}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <MapPin size={14} className="text-teal-600 shrink-0" />
                    <span>{parcel.address || parcel.destinationAddress || "Standard Delivery Route"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={14} className="text-slate-400 shrink-0" />
                    <span>{parcel.timestamp || "Recent"}</span>
                  </div>
                </div>

                {parcel.hash && (
                  <p className="text-[11px] font-mono text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded mt-2 w-fit">
                    ⛓️ Tx Hash: {parcel.hash}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0">
                <StatusBadge status={(parcel.status || "Created") as "Created" | "InTransit" | "Delivered"} />

                {parcel.status !== "Delivered" && (
                  <button
                    type="button"
                    onClick={() => setSelectedParcel(parcel)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-950 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer"
                  >
                    <ShieldCheck size={14} /> Verify & Complete
                  </button>
                )}
              </div>
            </section>
          ))
        )}
      </div>

      {selectedParcel && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 border shadow-2xl animate-in zoom-in-95 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <p className="text-xs text-teal-600 font-bold uppercase tracking-wider">
                  {selectedParcel.id}
                </p>
                <h3 className="font-black text-slate-900 text-lg">
                  Confirm Delivery Handoff
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedParcel(null);
                  setStatusMsg(null);
                }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Enter the receiver&apos;s 6-digit OTP code to execute the smart contract function and release the escrow payout directly to your wallet.
            </p>

            <form onSubmit={handleVerifyDelivery} className="space-y-4">
              <div>
                <label
                  htmlFor="courier-pin-input"
                  className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1"
                >
                  6-Digit Receiver OTP
                </label>
                <input
                  id="courier-pin-input"
                  type="password"
                  maxLength={6}
                  required
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="123456"
                  className="w-full p-3 font-mono text-center text-2xl tracking-widest font-black border rounded-xl outline-none text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {statusMsg && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold border ${getStatusBadgeStyle(
                    statusMsg.type
                  )}`}
                >
                  {statusMsg.text}
                </div>
              )}

              <button
                type="submit"
                disabled={isPending || !isConnected}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isPending ? "Executing On-Chain Settlement..." : "Release Escrow Payout"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}