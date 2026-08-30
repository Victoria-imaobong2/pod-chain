"use client";

import React, { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import { Package, Bell, MapPin, QrCode, X, Navigation } from "lucide-react";
import StatusBadge from "@/components/shared/StatusBadge";
import BottomNavReceiver from "@/components/navigation/BottomNavReceiver";
import EditReceiverProfileModal, { ReceiverProfile } from "@/components/EditReceiverProfileModal";
import CourierProximityModal from "@/components/CourierProximityModal";
import dynamic from "next/dynamic";
import { API_BASE_URL } from "@/lib/config";

const ReceiverKeyModal = dynamic(() => import("@/components/ReceiverKeyModal"), { ssr: false });
const VerifyRiderModal = dynamic(() => import("@/components/VerifyRiderModal"), { ssr: false });

export interface Shipment {
  id: string;
  sender?: string;
  item?: string;
  status?: string;
  timestamp?: string;
  hash?: string;
  pin?: string;
  address?: string;
  courierName?: string;
  courierPhone?: string;
  proximity_checkpoint?: string;
}

export interface DynamicNotification {
  id: string;
  type: "creation" | "proximity" | "delivered";
  message: string;
  timestamp: string;
  active: boolean;
}

const getNotificationItemStyle = (type: "creation" | "proximity" | "delivered") => {
  if (type === "proximity") return "bg-amber-50/70 border-amber-200 text-amber-900";
  if (type === "delivered") return "bg-emerald-50/70 border-emerald-200 text-emerald-900";
  return "bg-teal-50/70 border-teal-200 text-teal-900";
};

const DEFAULT_PROFILE: ReceiverProfile = {
  name: "Victoria-Imaobong Solomon",
  phone: "08123456789",
  email: "receiver@podchain.com",
  address: "No 04 Set Address Road, LGA, State, Nigeria.",
};

const subscribe = () => () => {};

export default function ReceiverDashboard() {
  const isClient = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );

  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [profile, setProfile] = useState<ReceiverProfile>(() => {
    if (typeof window === "undefined") return DEFAULT_PROFILE;
    const saved = localStorage.getItem("pod_receiver_profile");
    if (!saved) return DEFAULT_PROFILE;
    try {
      return JSON.parse(saved);
    } catch {
      return DEFAULT_PROFILE;
    }
  });

  const [notifications, setNotifications] = useState<DynamicNotification[]>([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
  const [isVerifyRiderOpen, setIsVerifyRiderOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isProximityModalOpen, setIsProximityModalOpen] = useState(false);
  const [selectedKeyParcel, setSelectedKeyParcel] = useState<Shipment | null>(null);
  const [inputHash, setInputHash] = useState("");

  const syncDynamicNotifications = useCallback((currentShipments: Shipment[]) => {
    const derivedAlerts: DynamicNotification[] = [];

    currentShipments.forEach((s) => {
      if (s.status === "Delivered") {
        derivedAlerts.push({
          id: `notif-del-${s.id}`,
          type: "delivered",
          message: `Package ${s.id} (${s.item || "Consignment"}) has been verified and delivered!`,
          timestamp: s.timestamp || "Just now",
          active: true,
        });
      } else if (s.status === "InTransit") {
        derivedAlerts.push({
          id: `notif-prox-${s.id}`,
          type: "proximity",
          message: `Rider is nearby with ${s.id}! Checkpoint: ${s.proximity_checkpoint || "Approaching destination"}.`,
          timestamp: s.timestamp || "Active",
          active: true,
        });
      } else {
        derivedAlerts.push({
          id: `notif-created-${s.id}`,
          type: "creation",
          message: `New package ${s.id} initialized in escrow ledger.`,
          timestamp: s.timestamp || "Recent",
          active: true,
        });
      }
    });

    setNotifications(derivedAlerts);
  }, []);

  const fetchReceiverShipments = useCallback(async () => {
    try {
      const baseUrl = API_BASE_URL || "http://127.0.0.1:8000";
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

      const res = await fetch(`${baseUrl}/api/v1/parcels/receiver-shipments`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        console.warn("Could not fetch receiver shipments, status:", res.status);
        return;
      }

      const data = await res.json();
      if (Array.isArray(data)) {
        const mapped: Shipment[] = data.map((item) => ({
          id: item.tracking_number || `POD-${item.id}`,
          sender: "Verified Merchant",
          item: item.contents_name || "General Cargo",
          status: item.status || "Created",
          timestamp: item.created_at ? item.created_at.substring(0, 16).replace("T", " ") : "Recent",
          hash: item.tx_hash
            ? item.tx_hash.substring(0, 6) + "..." + item.tx_hash.substring(item.tx_hash.length - 4)
            : "0x...",
          address: item.destination_address || profile.address,
          courierName: item.courier_name || "Assigning Courier...",
          courierPhone: item.courier_phone || "N/A",
          proximity_checkpoint: item.proximity_checkpoint,
        }));

        setShipments(mapped);
        syncDynamicNotifications(mapped);
      }
    } catch (err) {
      console.error("Failed to load receiver shipments:", err);
    }
  }, [profile.address, syncDynamicNotifications]);

  useEffect(() => {
    void fetchReceiverShipments();
    const interval = setInterval(() => {
      void fetchReceiverShipments();
    }, 4000);

    return () => clearInterval(interval);
  }, [fetchReceiverShipments]);

  if (!isClient) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Package size={36} className="text-teal-600 animate-pulse" />
      </div>
    );
  }

  const activeAlertsCount = notifications.filter((n) => n.active).length;

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, active: false } : n)));
  };

  const handleSaveProfile = (updated: ReceiverProfile) => {
    setProfile(updated);
    localStorage.setItem("pod_receiver_profile", JSON.stringify(updated));
  };

  const handleTrackHash = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    void fetchReceiverShipments();
    setInputHash("");
    setIsTrackModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 pb-32 max-w-7xl mx-auto font-sans antialiased">
      <header className="flex justify-between items-center border-b border-slate-200 pb-6 mb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Receiver Terminal</h1>
          <p className="text-slate-500 text-sm font-medium mt-0.5">Your monitored incoming blockchain shipments</p>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            className="p-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-2xl shadow-xs transition-all relative active:scale-95 cursor-pointer"
          >
            <Bell size={22} className={activeAlertsCount > 0 ? "animate-bounce" : ""} />
            {activeAlertsCount > 0 && (
              <span className="absolute top-2 right-2 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                {activeAlertsCount}
              </span>
            )}
          </button>

          {isNotificationOpen && (
            <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-50 space-y-3 animate-in fade-in slide-in-from-top-4 duration-200">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="font-extrabold text-slate-900 text-sm">State Change Alerts</h3>
                <span className="text-[10px] font-bold bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full uppercase">Realtime</span>
              </div>
              {notifications.filter((n) => n.active).length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No active package updates right now.</p>
              ) : (
                notifications
                  .filter((n) => n.active)
                  .map((n) => (
                    <div key={n.id} className={`p-3 rounded-xl border flex gap-3 items-start ${getNotificationItemStyle(n.type)}`}>
                      {n.type === "proximity" ? (
                        <Navigation size={16} className="text-amber-600 shrink-0 mt-0.5 animate-pulse" />
                      ) : (
                        <Package size={16} className="text-teal-600 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="text-xs font-semibold leading-relaxed">{n.message}</p>
                        <span className="text-[10px] text-slate-400 font-mono mt-1 block">{n.timestamp}</span>
                      </div>
                      <button type="button" onClick={() => dismissNotification(n.id)} className="text-slate-400 hover:text-slate-600 shrink-0 cursor-pointer">
                        <X size={14} />
                      </button>
                    </div>
                  ))
              )}
            </div>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xs font-black tracking-widest text-slate-400 uppercase">Live Transit Ledger</h2>

          {shipments.length === 0 ? (
            <div className="p-12 bg-white border border-slate-200 rounded-2xl text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                <Package size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">No deliveries yet</h3>
                <p className="text-slate-500 text-xs mt-1">Please come back later. Any incoming package dispatched to you will appear here in real-time.</p>
              </div>
            </div>
          ) : (
            shipments.map((shipment, idx) => (
              <section key={shipment.id || idx} className="bg-white p-6 border border-slate-200 rounded-2xl shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition-all">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl shrink-0 ${shipment.status === "Delivered" ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600"}`}>
                    <Package size={26} />
                  </div>
                  <div>
                    <h3 className="font-extrabold tracking-tight text-slate-900 text-lg">{shipment.item || "General Goods"}</h3>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">Merchant: {shipment.sender || "POD Merchant"} • ID: {shipment.id}</p>
                    <p className="text-[11px] font-mono text-slate-500 bg-slate-50 border px-1.5 py-0.5 rounded mt-2 w-fit">⛓️ Anchor: {shipment.hash || "0x..."}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0">
                  <StatusBadge status={(shipment.status || "Created") as "Created" | "InTransit" | "Delivered"} />
                  {shipment.status !== "Delivered" && (
                    <button
                      type="button"
                      onClick={() => setSelectedKeyParcel(shipment)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer"
                    >
                      <QrCode size={14} /> Key
                    </button>
                  )}
                </div>
              </section>
            ))
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-xs font-black tracking-widest text-slate-400 uppercase">Registered Destination Profile</h2>
          <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="flex gap-3 items-start text-sm text-slate-700 leading-relaxed">
              <MapPin size={20} className="text-teal-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-900">{profile.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{profile.phone}</p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{profile.address}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex gap-2">
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(true)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                ✏️ Edit Profile
              </button>
              <button
                type="button"
                onClick={() => setIsVerifyRiderOpen(true)}
                className="flex-1 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold rounded-xl text-xs border border-teal-200 transition cursor-pointer"
              >
                🛡️ Verify Rider
              </button>
            </div>
          </section>
        </div>
      </div>

      {isTrackModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 border shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="font-black text-slate-900 text-lg">Track New Delivery Hash</h3>
              <button type="button" onClick={() => setIsTrackModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleTrackHash} className="space-y-4">
              <div>
                <label htmlFor="hash-in" className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                  Contract Hash String
                </label>
                <input
                  id="hash-in"
                  type="text"
                  required
                  value={inputHash}
                  onChange={(e) => setInputHash(e.target.value)}
                  placeholder="0x..."
                  className="w-full p-3 font-mono text-sm border rounded-xl outline-none text-slate-900 bg-slate-50 focus:bg-white"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-slate-950 hover:bg-slate-900 text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow shadow-slate-950/20 cursor-pointer"
              >
                Sync Records
              </button>
            </form>
          </div>
        </div>
      )}

      {selectedKeyParcel && (
        <ReceiverKeyModal
          parcel={selectedKeyParcel}
          onClose={() => setSelectedKeyParcel(null)}
        />
      )}

      {isVerifyRiderOpen && (
        <VerifyRiderModal onClose={() => setIsVerifyRiderOpen(false)} />
      )}

      {isEditProfileOpen && (
        <EditReceiverProfileModal
          currentProfile={profile}
          onSave={handleSaveProfile}
          onClose={() => setIsEditProfileOpen(false)}
        />
      )}

      {isProximityModalOpen && (
        <CourierProximityModal
          activeParcels={shipments.filter((s) => s.status !== "Delivered")}
          onClose={() => setIsProximityModalOpen(false)}
        />
      )}

      <BottomNavReceiver
        onCreateClick={() => setIsProximityModalOpen(true)}
        onVerifyRiderClick={() => setIsVerifyRiderOpen(true)}
      />
    </div>
  );
}