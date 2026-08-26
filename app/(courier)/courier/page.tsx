"use client";

import React, { useEffect, useState, useCallback, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import {
  Truck,
  QrCode,
  CheckCircle2,
  MapPin,
  X,
  ShieldCheck,
  Check,
  Navigation,
} from "lucide-react";
import { useAccount } from "wagmi";

import StatusBadge from "@/components/shared/StatusBadge";
import BottomNavCourier from "@/components/navigation/BottomNavCourier";
import FreeRouteMap from "@/components/shared/FreeRouteMap";
import { useConfirmDeliveryHandler } from "../../../hooks/useConfirmDeliveryHandler";
import { API_BASE_URL } from "@/lib/config";

export interface CourierParcel {
  id: number | string;
  tracking_number?: string;
  contents_name?: string;
  destination_address?: string;
  receiver_phone?: string;
  courier_address?: string;
  courier_name?: string;
  courier_phone?: string;
  proximity_checkpoint?: string;
  status?: "Created" | "InTransit" | "Delivered";
  tx_hash?: string;
  created_at?: string;
  amountEth?: string;
}

const subscribe = () => () => {};

export default function CourierDashboard() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { handleConfirmDelivery, isPending } = useConfirmDeliveryHandler();

  const isClient = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );

  const [parcels, setParcels] = useState<CourierParcel[]>([]);
  const [activeTab, setActiveTab] = useState<"available" | "active" | "completed">("available");
  const [selectedParcel, setSelectedParcel] = useState<CourierParcel | null>(null);
  const [selectedMapParcel, setSelectedMapParcel] = useState<CourierParcel | null>(null);
  const [pinInput, setPinInput] = useState("");
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  const refreshParcels = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL || "http://127.0.0.1:8000"}/api/v1/parcels/available`);
      if (res.ok) {
        const data = await res.json();
        setParcels(data);
      }
    } catch (err: unknown) {
      console.error("Failed to load parcels from backend:", err);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadParcels() {
      try {
        const res = await fetch(`${API_BASE_URL || "http://127.0.0.1:8000"}/api/v1/parcels/available`);
        if (res.ok) {
          const data = await res.json();
          if (!ignore) {
            setParcels(data);
          }
        }
      } catch (err: unknown) {
        if (!ignore) {
          console.error("Failed to load parcels from backend:", err);
        }
      }
    }

    void loadParcels();

    return () => {
      ignore = true;
    };
  }, []);

  const availableParcels = parcels.filter((p) => p.status === "Created" || !p.status);
  const activeParcels = parcels.filter(
    (p) => p.status === "InTransit" && p.courier_address?.toLowerCase() === address?.toLowerCase()
  );
  const completedParcels = parcels.filter((p) => p.status === "Delivered");

  const displayedParcels =
    activeTab === "available" ? availableParcels : activeTab === "active" ? activeParcels : completedParcels;

  const handleAcceptJob = async (parcelId: number | string) => {
    if (!isConnected || !address) {
      alert("Please connect your wallet first.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL || "http://127.0.0.1:8000"}/api/v1/parcels/${parcelId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courier_wallet: address,
          courier_name: "Verified Rider",
          courier_phone: "07039102053",
        }),
      });

      if (!res.ok) throw new Error("Could not accept job.");
      await refreshParcels();
      setActiveTab("active");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred";
      alert(msg);
    }
  };

  const handleUpdateProximity = async (parcelId: number | string, checkpoint: string) => {
    try {
      await fetch(`${API_BASE_URL || "http://127.0.0.1:8000"}/api/v1/parcels/${parcelId}/proximity`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkpoint }),
      });

      setParcels((prev) =>
        prev.map((p) => (p.id === parcelId ? { ...p, proximity_checkpoint: checkpoint } : p))
      );

      if (selectedMapParcel && selectedMapParcel.id === parcelId) {
        setSelectedMapParcel({ ...selectedMapParcel, proximity_checkpoint: checkpoint });
      }
    } catch (err: unknown) {
      console.error("Proximity update failed:", err);
    }
  };

  const handleVerifyDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParcel || !isConnected) return;

    setStatusMsg({ type: "info", text: "Submitting proof of delivery on-chain..." });
    const numericId = Number(String(selectedParcel.id).replace(/\D/g, "")) || 1;

    try {
      const result = await handleConfirmDelivery(numericId, pinInput);
      if (result?.success) {
        setStatusMsg({ type: "success", text: "Escrow released successfully to your wallet!" });
        await handleUpdateProximity(selectedParcel.id, "Delivered");
        setPinInput("");
        setTimeout(() => {
          setSelectedParcel(null);
          setStatusMsg(null);
          void refreshParcels();
        }, 2000);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Confirmation failed";
      setStatusMsg({ type: "error", text: msg });
    }
  };

  if (!isClient) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Truck size={36} className="text-teal-600 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 pb-32 max-w-7xl mx-auto font-sans antialiased">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-6 mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Courier Dispatch Terminal</h1>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
              Verified Rider
            </span>
          </div>
          <p className="text-slate-500 text-sm font-medium mt-0.5">
            Accept orders, record GPS checkpoints, and execute instant smart contract payouts.
          </p>
        </div>

        <button
          onClick={() => router.push("/courier/scan")}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition"
        >
          <QrCode size={18} />
          <span>Launch Camera Scanner</span>
        </button>
      </header>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Available Orders</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{availableParcels.length}</h3>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Truck size={24} />
          </div>
        </div>

        <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">In-Transit Tasks</p>
            <h3 className="text-2xl font-black text-blue-600 mt-1">{activeParcels.length}</h3>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Navigation size={24} />
          </div>
        </div>

        <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completed</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">{completedParcels.length}</h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 size={24} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 text-xs font-semibold mb-4">
        {(["available", "active", "completed"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3.5 py-1.5 rounded-full capitalize transition ${
              activeTab === tab ? "bg-slate-900 text-white font-bold" : "bg-slate-200 text-slate-600"
            }`}
          >
            {tab} ({tab === "available" ? availableParcels.length : tab === "active" ? activeParcels.length : completedParcels.length})
          </button>
        ))}
      </div>

      {/* Parcels List */}
      <div className="space-y-4">
        {displayedParcels.length === 0 ? (
          <div className="p-12 bg-white border border-slate-200 rounded-2xl text-center space-y-2">
            <Truck size={24} className="mx-auto text-slate-400" />
            <h3 className="font-bold text-slate-800">No shipments found in this category</h3>
          </div>
        ) : (
          displayedParcels.map((parcel) => (
            <div
              key={parcel.id}
              className="bg-white p-6 border border-slate-200 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-900">{parcel.contents_name || "General Cargo"}</span>
                  <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded font-bold">
                    {parcel.tracking_number || `#${parcel.id}`}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <MapPin size={14} className="text-teal-600" />
                    {parcel.destination_address}
                  </span>
                  {parcel.proximity_checkpoint && (
                    <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-semibold">
                      {parcel.proximity_checkpoint}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <StatusBadge status={parcel.status || "Created"} />

                {activeTab === "available" && (
                  <button
                    onClick={() => handleAcceptJob(parcel.id)}
                    className="flex items-center gap-1 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl"
                  >
                    <Check size={14} /> Accept Job
                  </button>
                )}

                {activeTab === "active" && (
                  <>
                    <button
                      onClick={() => setSelectedMapParcel(parcel)}
                      className="flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl"
                    >
                      <Navigation size={14} className="text-teal-600" /> Map
                    </button>
                    <button
                      onClick={() => setSelectedParcel(parcel)}
                      className="flex items-center gap-1 px-4 py-2 bg-slate-950 text-white text-xs font-bold rounded-xl"
                    >
                      <ShieldCheck size={14} /> Verify OTP
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Map Modal with Free Leaflet Map */}
      {selectedMapParcel && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 border shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-black text-slate-900 text-lg">Route & Proximity Telemetry</h3>
              <button onClick={() => setSelectedMapParcel(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            {/* Free Leaflet Map */}
            <FreeRouteMap
              lat={5.4851}
              lng={7.0353}
              label={selectedMapParcel.destination_address || "Delivery Location"}
            />

            {/* Checkpoint Controls */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Update Checkpoint
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {["Picked Up", "0.8km Away", "Arrived at Location"].map((checkpoint) => (
                  <button
                    key={checkpoint}
                    onClick={() => handleUpdateProximity(selectedMapParcel.id, checkpoint)}
                    className={`p-2 rounded-xl font-bold border transition ${
                      selectedMapParcel.proximity_checkpoint === checkpoint
                        ? "bg-teal-600 text-white border-teal-600"
                        : "bg-slate-50 border-slate-200 text-slate-700"
                    }`}
                  >
                    {checkpoint}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setSelectedMapParcel(null)}
              className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl text-sm"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* OTP Delivery Verification Modal */}
      {selectedParcel && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 border shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-black text-slate-900 text-lg">Confirm Delivery Handoff</h3>
              <button onClick={() => setSelectedParcel(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleVerifyDelivery} className="space-y-4">
              <input
                type="password"
                maxLength={6}
                required
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="w-full p-3 font-mono text-center text-2xl tracking-widest font-black border rounded-xl bg-slate-50"
              />

              {statusMsg && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold ${
                    statusMsg.type === "success"
                      ? "bg-green-50 text-green-800"
                      : statusMsg.type === "info"
                      ? "bg-blue-50 text-blue-800"
                      : "bg-red-50 text-red-800"
                  }`}
                >
                  {statusMsg.text}
                </div>
              )}

              <button
                type="submit"
                disabled={isPending || pinInput.length !== 6}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-sm disabled:opacity-50"
              >
                {isPending ? "Executing On-Chain Settlement..." : "Release Escrow Payout"}
              </button>
            </form>
          </div>
        </div>
      )}

      <BottomNavCourier />
    </div>
  );
}