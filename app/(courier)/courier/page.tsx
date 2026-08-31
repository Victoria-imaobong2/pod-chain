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
  User,
  LogOut,
  Copy,
  ChevronDown,
} from "lucide-react";
import { useAccount, useDisconnect, useBalance } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";

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
  const { disconnect } = useDisconnect();
  const { data: balanceData } = useBalance({ address });
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
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchAllParcels = useCallback(async () => {
    try {
      const baseUrl = API_BASE_URL || "https://podchain-backend.onrender.com";

      const [resAvailable, resAll] = await Promise.allSettled([
        fetch(`${baseUrl}/api/v1/parcels/available`),
        fetch(`${baseUrl}/api/v1/parcels/`),
      ]);

      const availableData =
        resAvailable.status === "fulfilled" && resAvailable.value.ok
          ? await resAvailable.value.json()
          : [];
      const allData =
        resAll.status === "fulfilled" && resAll.value.ok
          ? await resAll.value.json()
          : [];

      const combined = [...availableData, ...allData];
      const uniqueMap = new Map<string, CourierParcel>();
      combined.forEach((item) => uniqueMap.set(String(item.id), item));

      return Array.from(uniqueMap.values());
    } catch (err) {
      console.error("Auto-sync polling failed:", err);
      return [];
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const runFetch = async () => {
      const data = await fetchAllParcels();
      if (isMounted && data.length > 0) {
        setParcels(data);
      }
    };

    void runFetch();
    const interval = setInterval(() => {
      void runFetch();
    }, 4000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [fetchAllParcels]);

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const availableParcels = parcels.filter(
    (p) => !p.status || p.status === "Created"
  );

  const activeParcels = parcels.filter((p) => {
    const isTransit = p.status === "InTransit";
    if (!isTransit) return false;
    if (!address || !p.courier_address) return true;
    return p.courier_address.toLowerCase() === address.toLowerCase();
  });

  const completedParcels = parcels.filter((p) => p.status === "Delivered");

  const getDisplayedParcels = (): CourierParcel[] => {
    if (activeTab === "available") return availableParcels;
    if (activeTab === "active") return activeParcels;
    return completedParcels;
  };

  const displayedParcels = getDisplayedParcels();

  // 1. Accept Job: Updates backend and registers courier on-chain without auto-opening the OTP modal
 const handleAcceptJob = async (parcelId: number | string) => {
    if (!isConnected || !address) {
      alert("Please connect your wallet first.");
      return;
    }

    // Ensure OTP confirmation dialog remains closed
    setSelectedParcel(null);

    try {
      const baseUrl = API_BASE_URL || "http://127.0.0.1:8000";
      const res = await fetch(`${baseUrl}/api/v1/parcels/${parcelId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courier_wallet: address,
          courier_name: "Verified Rider",
          courier_phone: "070310000000",
        }),
      });

      if (!res.ok) throw new Error("Could not accept job.");

      setParcels((prev) =>
        prev.map((p) =>
          String(p.id) === String(parcelId)
            ? { ...p, status: "InTransit", courier_address: address }
            : p
        )
      );

      setActiveTab("active");
      const updated = await fetchAllParcels();
      if (updated.length > 0) setParcels(updated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred";
      alert(msg);
    }
  };

  // 2. Proximity Update
  const handleUpdateProximity = async (parcelId: number | string, checkpoint: string) => {
    try {
      const baseUrl = API_BASE_URL || "http://127.0.0.1:8000";
      await fetch(`${baseUrl}/api/v1/parcels/${parcelId}/proximity`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkpoint }),
      });

      setParcels((prev) =>
        prev.map((p) => (p.id === parcelId ? { ...p, proximity_checkpoint: checkpoint } : p))
      );

      if (selectedMapParcel?.id === parcelId) {
        setSelectedMapParcel({ ...selectedMapParcel, proximity_checkpoint: checkpoint });
      }
    } catch (err: unknown) {
      console.error("Proximity update failed:", err);
    }
  };

  // 3. Verify PIN Settlement
  const handleVerifyDelivery = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedParcel || !isConnected) return;

    setStatusMsg({ type: "info", text: "Submitting proof of delivery on-chain..." });

    const onChainId = Number(selectedParcel.id) || 1;
    console.log("--> Calling confirmDeliveryWithCode for ID:", onChainId, "with PIN:", pinInput);

    try {
      // 1. Execute smart contract payout
      const result = await handleConfirmDelivery(onChainId, pinInput);

      if (result?.success) {
        setStatusMsg({ type: "success", text: "Escrow released! Updating delivery status..." });

        const baseUrl = API_BASE_URL || "http://127.0.0.1:8000";

        // 2. Notify backend database that delivery was verified on-chain
        try {
          await fetch(`${baseUrl}/api/v1/parcels/${selectedParcel.id}/confirm-delivery`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tx_hash: result.txHash,
              delivery_code: pinInput,
            }),
          });
        } catch (dbErr) {
          console.warn("Backend confirm sync fallback:", dbErr);
        }

        // 3. Update local state immediately so it moves to the 'Completed' tab
        setParcels((prev) =>
          prev.map((p) =>
            String(p.id) === String(selectedParcel.id)
              ? { ...p, status: "Delivered", proximity_checkpoint: "Delivered" }
              : p
          )
        );

        setPinInput("");
        setTimeout(async () => {
          setSelectedParcel(null);
          setStatusMsg(null);
          const updated = await fetchAllParcels();
          if (updated.length > 0) setParcels(updated);
        }, 1500);
      }
    } catch (err: unknown) {
      console.error("Delivery settlement failed:", err);
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
      {/* HEADER WITH PROFILE & RAINBOWKIT CONNECT BUTTON */}
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
            onClick={() => router.push("/scan")}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition cursor-pointer"
          >
            <QrCode size={18} />
            <span>Scan QR</span>
          </button>

          {/* Profile & Wallet Drawer Button */}
          <div className="relative">
            {isConnected && address ? (
              <button
                type="button"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 bg-white border border-slate-300 hover:border-slate-400 py-1.5 px-3 rounded-xl shadow-xs transition cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs">
                  <User size={14} />
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-bold text-slate-800 font-mono">
                    {address.substring(0, 6)}...{address.slice(-4)}
                  </p>
                  <p className="text-[10px] text-teal-600 font-semibold font-mono">
                    {balanceData ? `${parseFloat(balanceData.formatted).toFixed(3)} ${balanceData.symbol}` : "0.00 ETH"}
                  </p>
                </div>
                <ChevronDown size={14} className="text-slate-400" />
              </button>
            ) : (
              <ConnectButton showBalance={false} />
            )}

            {/* Profile Dropdown */}
            {showProfileMenu && isConnected && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-50 animate-in fade-in">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Courier Wallet</p>
                <div className="flex items-center justify-between mt-1 mb-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
                  <span className="font-mono text-xs text-slate-700 font-semibold">
                    {address?.substring(0, 6)}...{address?.slice(-4)}
                  </span>
                  <button
                    type="button"
                    onClick={copyAddress}
                    className="p-1 hover:bg-slate-200 rounded text-slate-500 transition cursor-pointer"
                  >
                    {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  </button>
                </div>

                <div className="mb-3">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Balance</p>
                  <p className="text-lg font-black text-slate-900 font-mono">
                    {balanceData ? `${parseFloat(balanceData.formatted).toFixed(4)} ${balanceData.symbol}` : "0.00 ETH"}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                  <ConnectButton />
                  <button
                    type="button"
                    onClick={() => {
                      disconnect();
                      setShowProfileMenu(false);
                    }}
                    className="w-full text-left text-xs font-bold text-rose-600 hover:bg-rose-50 p-2 rounded-xl transition flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut size={14} /> Disconnect
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* METRIC CARDS */}
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

      {/* TABS */}
      <div className="flex gap-2 text-xs font-semibold mb-4">
        {(["available", "active", "completed"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-3.5 py-1.5 rounded-full capitalize transition cursor-pointer ${
              activeTab === tab ? "bg-slate-900 text-white font-bold" : "bg-slate-200 text-slate-600"
            }`}
          >
            {tab} ({tab === "available" ? availableParcels.length : tab === "active" ? activeParcels.length : completedParcels.length})
          </button>
        ))}
      </div>

      {/* LIST OF SHIPMENTS */}
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
                    type="button"
                    onClick={() => handleAcceptJob(parcel.id)}
                    className="flex items-center gap-1 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    <Check size={14} /> Accept Job
                  </button>
                )}

                {activeTab === "active" && (
                  <>
                    <button
                      type="button"
                      onClick={() => setSelectedMapParcel(parcel)}
                      className="flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl cursor-pointer"
                    >
                      <Navigation size={14} className="text-teal-600" /> Map
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedParcel(parcel);
                        setPinInput("");
                        setStatusMsg(null);
                      }}
                      className="flex items-center gap-1 px-4 py-2 bg-slate-950 hover:bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer"
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

      {/* MODAL: MAP TELEMETRY */}
      {selectedMapParcel && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-black text-slate-900 text-lg">Route & Proximity Telemetry</h3>
              <button
                type="button"
                onClick={() => setSelectedMapParcel(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <FreeRouteMap
              lat={5.4851}
              lng={7.0353}
              label={selectedMapParcel.destination_address || "Delivery Location"}
            />

            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Update Checkpoint
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {["Picked Up", "0.8km Away", "Arrived at Location"].map((checkpoint) => (
                  <button
                    key={checkpoint}
                    type="button"
                    onClick={() => handleUpdateProximity(selectedMapParcel.id, checkpoint)}
                    className={`p-2 rounded-xl font-bold border transition cursor-pointer ${
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
              type="button"
              onClick={() => setSelectedMapParcel(null)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-sm transition cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* MODAL: OTP CONFIRMATION */}
      {selectedParcel && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-black text-slate-900 text-lg">Confirm Delivery Handoff</h3>
              <button
                type="button"
                onClick={() => {
                  setSelectedParcel(null);
                  setPinInput("");
                  setStatusMsg(null);
                }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
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
                className="w-full p-3 font-mono text-center text-2xl tracking-widest font-black border border-slate-300 rounded-xl bg-slate-50 outline-none focus:border-teal-500 transition"
              />

              {statusMsg && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold ${
                    statusMsg.type === "success"
                      ? "bg-green-50 text-green-800 border border-green-200"
                      : statusMsg.type === "info"
                      ? "bg-blue-50 text-blue-800 border border-blue-200"
                      : "bg-red-50 text-red-800 border border-red-200"
                  }`}
                >
                  {statusMsg.text}
                </div>
              )}

              <button
                type="submit"
                disabled={isPending || pinInput.length !== 6}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-sm transition disabled:opacity-50 cursor-pointer"
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