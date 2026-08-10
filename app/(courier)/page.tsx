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
  Wallet,
  Check,
  Navigation,
  DollarSign,
  User,
  Phone,
} from "lucide-react";
import StatusBadge from "@/components/shared/StatusBadge";
import { useConfirmDeliveryHandler } from "../../hooks/useConfirmDeliveryHandler";
import { useAccount } from "wagmi";

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
  amountEth?: string;
  courierAddress?: string;
  courierName?: string;
  courierPhone?: string;
  proximityCheckpoint?: string;
}

export interface CourierProfile {
  name: string;
  phone: string;
  walletAddress: string;
  availableBalanceEth: number;
}

const DEFAULT_COURIER_PROFILE: CourierProfile = {
  name: "Chidi Okereke",
  phone: "07039102053",
  walletAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  availableBalanceEth: 0.15,
};

export default function CourierDashboard() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { handleConfirmDelivery, isPending } = useConfirmDeliveryHandler();

  const [isMounted, setIsMounted] = useState(false);
  const [parcels, setParcels] = useState<CourierParcel[]>([]);
  const [profile, setProfile] = useState<CourierProfile>(DEFAULT_COURIER_PROFILE);
  const [activeTab, setActiveTab] = useState<"available" | "active" | "completed">("available");
  
  const [selectedParcel, setSelectedParcel] = useState<CourierParcel | null>(null);
  const [pinInput, setPinInput] = useState("");
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedMapParcel, setSelectedMapParcel] = useState<CourierParcel | null>(null);

  const [statusMsg, setStatusMsg] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  // Sync profile & parcels safely after client mount
  const loadData = useCallback(() => {
    const savedParcels: CourierParcel[] = JSON.parse(localStorage.getItem("pod_parcels") || "[]");
    setParcels(savedParcels);

    const savedProfile = localStorage.getItem("pod_courier_profile");
    if (savedProfile) {
      try {
        setProfile(JSON.parse(savedProfile));
      } catch (e) {
        console.error("Error reading courier profile", e);
      }
    }
  }, []);

  useEffect(() => {
    setIsMounted(true);
    loadData();

    window.addEventListener("storage_updated", loadData);
    window.addEventListener("focus", loadData);

    return () => {
      window.removeEventListener("storage_updated", loadData);
      window.removeEventListener("focus", loadData);
    };
  }, [loadData]);

  // Keep wallet address synced with Wagmi wallet connection
  useEffect(() => {
    if (address) {
      setProfile((prev) => {
        const updated = { ...prev, walletAddress: address };
        localStorage.setItem("pod_courier_profile", JSON.stringify(updated));
        return updated;
      });
    }
  }, [address]);

  if (!isMounted) return null;

  // Derived arrays
  const availableParcels = parcels.filter((p) => p.status === "Created" || !p.status);
  const activeParcels = parcels.filter(
    (p) => p.status === "InTransit" && p.courierAddress?.toLowerCase() === profile.walletAddress.toLowerCase()
  );
  const completedParcels = parcels.filter((p) => p.status === "Delivered");

  // Accept job
  const handleAcceptJob = (parcelId: string) => {
    const updated = parcels.map((p) => {
      if (p.id === parcelId) {
        return {
          ...p,
          status: "InTransit" as const,
          courierAddress: profile.walletAddress,
          courierName: profile.name,
          courierPhone: profile.phone,
          proximityCheckpoint: "Dispatched from Merchant",
        };
      }
      return p;
    });

    localStorage.setItem("pod_parcels", JSON.stringify(updated));
    setParcels(updated);
    window.dispatchEvent(new Event("storage_updated"));
    setActiveTab("active");
  };

  // Reject job
  const handleRejectJob = (parcelId: string) => {
    const updated = parcels.filter((p) => p.id !== parcelId);
    localStorage.setItem("pod_parcels", JSON.stringify(updated));
    setParcels(updated);
    window.dispatchEvent(new Event("storage_updated"));
  };

  // Proximity update checkpoint
  const handleUpdateProximity = (parcelId: string, checkpoint: string) => {
    const updated = parcels.map((p) => (p.id === parcelId ? { ...p, proximityCheckpoint: checkpoint } : p));
    localStorage.setItem("pod_parcels", JSON.stringify(updated));
    setParcels(updated);
    window.dispatchEvent(new Event("storage_updated"));
  };

  // Verify delivery and claim payout
  const handleVerifyDelivery = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedParcel) return;

    setStatusMsg({ type: "info", text: "Submitting proof of delivery on-chain..." });
    const numericId = Number.parseInt(selectedParcel.id.replace(/\D/g, "") || "1", 10);

    try {
      const res = await handleConfirmDelivery(numericId, pinInput);

      if (res?.success) {
        const reward = Number.parseFloat(selectedParcel.amountEth || "0.05");
        const updatedProfile = {
          ...profile,
          availableBalanceEth: profile.availableBalanceEth + reward,
        };

        localStorage.setItem("pod_courier_profile", JSON.stringify(updatedProfile));
        setProfile(updatedProfile);

        const updated = parcels.map((p) =>
          p.id === selectedParcel.id ? { ...p, status: "Delivered" as const, proximityCheckpoint: "Delivered" } : p
        );

        localStorage.setItem("pod_parcels", JSON.stringify(updated));
        setParcels(updated);
        window.dispatchEvent(new Event("storage_updated"));

        setStatusMsg({
          type: "success",
          text: `Escrow payout released! +${reward} ETH added to your wallet balance.`,
        });

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
        text: error.message || "Invalid OTP PIN or contract execution failed.",
      });
    }
  };

  const getTabClass = (isSelected: boolean) =>
    isSelected ? "bg-slate-900 text-white font-bold" : "bg-slate-200 text-slate-600 hover:bg-slate-300";

  const displayedParcels =
    activeTab === "available"
      ? availableParcels
      : activeTab === "active"
      ? activeParcels
      : completedParcels;

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

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsProfileModalOpen(true)}
            className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all text-sm cursor-pointer"
          >
            <User size={16} className="text-teal-600" />
            <span>Rider Profile</span>
          </button>

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

      {/* Wallet Balance & Escrow Metrics Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-md border border-slate-700 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-widest text-teal-400">Escrow Wallet Balance</span>
            <DollarSign size={20} className="text-teal-400" />
          </div>
          <div className="mt-4">
            <h2 className="text-3xl font-black">{profile.availableBalanceEth.toFixed(3)} ETH</h2>
            <p className="text-[11px] text-slate-400 font-mono mt-1 truncate">Payout: {profile.walletAddress}</p>
          </div>
        </div>

        <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Available Orders</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{availableParcels.length}</h3>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Truck size={24} />
          </div>
        </div>

        <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">In-Transit Tasks</p>
            <h3 className="text-2xl font-black text-blue-600 mt-1">{activeParcels.length}</h3>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Navigation size={24} />
          </div>
        </div>

        <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completed Deliveries</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">{completedParcels.length}</h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 size={24} />
          </div>
        </div>
      </div>

      {/* Main Queue View */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h2 className="text-xs font-black tracking-widest text-slate-400 uppercase">Dispatch Management Queue</h2>

          <div className="flex gap-2 text-xs font-semibold">
            <button type="button" onClick={() => setActiveTab("available")} className={`px-3.5 py-1.5 rounded-full transition cursor-pointer ${getTabClass(activeTab === "available")}`}>
              Available Orders ({availableParcels.length})
            </button>
            <button type="button" onClick={() => setActiveTab("active")} className={`px-3.5 py-1.5 rounded-full transition cursor-pointer ${getTabClass(activeTab === "active")}`}>
              My Active Deliveries ({activeParcels.length})
            </button>
            <button type="button" onClick={() => setActiveTab("completed")} className={`px-3.5 py-1.5 rounded-full transition cursor-pointer ${getTabClass(activeTab === "completed")}`}>
              Completed ({completedParcels.length})
            </button>
          </div>
        </div>

        {displayedParcels.length === 0 ? (
          <div className="p-12 bg-white border border-slate-200 rounded-2xl text-center space-y-3 shadow-xs">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <Truck size={24} />
            </div>
            <h3 className="font-bold text-slate-800 text-base">No shipments found in this category</h3>
            <p className="text-slate-500 text-xs">New merchant orders will appear here in real time for courier assignment.</p>
          </div>
        ) : (
          displayedParcels.map((parcel) => (
            <section key={parcel.id} className="bg-white p-6 border border-slate-200 rounded-2xl shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition-all">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-900 text-lg">{parcel.item || "General Freight Cargo"}</span>
                  <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">{parcel.id}</span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    +{parcel.amountEth || "0.05"} ETH Escrow
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <MapPin size={14} className="text-teal-600 shrink-0" />
                    <span>{parcel.address || parcel.destinationAddress || "Standard Route"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={14} className="text-slate-400 shrink-0" />
                    <span>{parcel.timestamp || "Recent"}</span>
                  </div>
                </div>

                {parcel.proximityCheckpoint && (
                  <p className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg w-fit flex items-center gap-1.5">
                    <Navigation size={12} className="animate-pulse" /> Status: {parcel.proximityCheckpoint}
                  </p>
                )}
              </div>

              {/* Action Handlers based on state */}
              <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0">
                <StatusBadge status={(parcel.status || "Created") as "Created" | "InTransit" | "Delivered"} />

                {activeTab === "available" && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleAcceptJob(parcel.id)}
                      className="inline-flex items-center gap-1 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      <Check size={14} /> Accept Job
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRejectJob(parcel.id)}
                      className="inline-flex items-center gap-1 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      <X size={14} /> Reject
                    </button>
                  </div>
                )}

                {activeTab === "active" && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedMapParcel(parcel)}
                      className="inline-flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      <Navigation size={14} className="text-teal-600" /> Route Map
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedParcel(parcel)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-950 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      <ShieldCheck size={14} /> Verify OTP
                    </button>
                  </div>
                )}
              </div>
            </section>
          ))
        )}
      </div>

      {/* Courier Rider Profile Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 border shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-black text-slate-900 text-lg">Courier Rider Profile</h3>
              <button type="button" onClick={() => setIsProfileModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                localStorage.setItem("pod_courier_profile", JSON.stringify(profile));
                setIsProfileModalOpen(false);
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-500 uppercase tracking-widest mb-1">Rider Full Name</label>
                <input
                  type="text"
                  required
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full p-3 border rounded-xl bg-slate-50 text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-500 uppercase tracking-widest mb-1">Phone Contact</label>
                <input
                  type="text"
                  required
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full p-3 border rounded-xl bg-slate-50 text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-500 uppercase tracking-widest mb-1">Smart Contract Payout Wallet Address</label>
                <input
                  type="text"
                  required
                  value={profile.walletAddress}
                  onChange={(e) => setProfile({ ...profile, walletAddress: e.target.value })}
                  className="w-full p-3 border rounded-xl bg-slate-50 text-slate-900 font-mono text-[11px]"
                />
              </div>

              <button type="submit" className="w-full bg-slate-900 hover:bg-black text-white font-bold py-3 rounded-xl text-sm transition cursor-pointer">
                Save Rider Profile
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Route & Proximity GPS Checkpoint Modal */}
      {selectedMapParcel && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 border shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-teal-600">{selectedMapParcel.id}</span>
                <h3 className="font-black text-slate-900 text-lg">Route & Proximity Telemetry</h3>
              </div>
              <button type="button" onClick={() => setSelectedMapParcel(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            {/* Google Maps / Proximity Route Visualization Container */}
            <div className="relative w-full h-52 bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden flex flex-col items-center justify-center p-4 text-center">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#0d9488_1px,transparent_1px)] bg-[size:16px_16px]"></div>
              <Navigation size={32} className="text-teal-600 animate-bounce mb-2 z-10" />
              <p className="text-xs font-bold text-slate-800 z-10">Google Maps Navigation Stream Active</p>
              <p className="text-[11px] text-slate-500 max-w-xs z-10 mt-0.5">
                Target Destination: {selectedMapParcel.address || "Douglas Road, Owerri"}
              </p>
            </div>

            {/* Proximity Checkpoint Selector */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">Update Rider Location Checkpoint</label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {["Picked Up", "0.8km Away", "Arrived at Location"].map((cp) => (
                  <button
                    key={cp}
                    type="button"
                    onClick={() => {
                      handleUpdateProximity(selectedMapParcel.id, cp);
                      setSelectedMapParcel({ ...selectedMapParcel, proximityCheckpoint: cp });
                    }}
                    className={`p-2 rounded-xl font-bold border transition ${
                      selectedMapParcel.proximityCheckpoint === cp
                        ? "bg-teal-600 text-white border-teal-600"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {cp}
                  </button>
                ))}
              </div>
            </div>

            <button type="button" onClick={() => setSelectedMapParcel(null)} className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl text-sm cursor-pointer">
              Done
            </button>
          </div>
        </div>
      )}

      {/* Verify & Complete OTP Settlement Modal */}
      {selectedParcel && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 border shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <p className="text-xs text-teal-600 font-bold uppercase tracking-wider">{selectedParcel.id}</p>
                <h3 className="font-black text-slate-900 text-lg">Confirm Delivery Handoff</h3>
              </div>
              <button type="button" onClick={() => setSelectedParcel(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Enter the receiver&apos;s 6-digit OTP code to execute the smart contract function and release the escrow payout directly to your wallet.
            </p>

            <form onSubmit={handleVerifyDelivery} className="space-y-4">
              <div>
                <label htmlFor="courier-pin-input" className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
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
                <div className={`p-3 rounded-xl text-xs font-semibold border ${statusMsg.type === "success" ? "bg-green-50 text-green-800 border-green-200" : "bg-red-50 text-red-800 border-red-200"}`}>
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