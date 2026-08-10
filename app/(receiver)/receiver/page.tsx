"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Package, Bell, MapPin, QrCode, X, Navigation } from 'lucide-react';
import StatusBadge from '@/components/shared/StatusBadge';
import BottomNavReceiver from '@/components/navigation/BottomNavReceiver';
import EditReceiverProfileModal, { ReceiverProfile } from "@/components/EditReceiverProfileModal";
import dynamic from "next/dynamic";

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
}

interface NotificationItem {
  id: number;
  type: 'proximity' | 'dispatch';
  message: string;
  active: boolean;
}

export default function ReceiverDashboard() {
  const [shipments, setShipments] = useState<Shipment[]>(() => {
    if (typeof window === "undefined") return [];
    return JSON.parse(localStorage.getItem("pod_parcels") || "[]");
  });
  
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    { id: 1, type: 'proximity', message: 'Rider is nearby! Active parcel is less than 1km away.', active: true },
    { id: 2, type: 'dispatch', message: 'New consignment initialized: Escrow locked on-chain.', active: true }
  ]);

  const [profile, setProfile] = useState<ReceiverProfile>(() => {
    if (typeof window === "undefined") {
      return {
        name: "Victoria-Imaobong Solomon",
        phone: "08123456789",
        email: "receiver@email.com",
        address: "No 04 Set Address Road, LGA, State, Nigeria.",
      };
    }
    const saved = localStorage.getItem("pod_receiver_profile");
    return saved
      ? JSON.parse(saved)
      : {
          name: "Victoria-Imaobong Solomon",
          phone: "08123456789",
          email: "receiver@email.com",
          address: "No 04 Set Address Road, LGA, State, Nigeria.",
        };
  });

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
  const [isVerifyRiderOpen, setIsVerifyRiderOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [selectedKeyParcel, setSelectedKeyParcel] = useState<Shipment | null>(null);
  const [inputHash, setInputHash] = useState('');

  const loadShipments = useCallback(() => {
    const localData = JSON.parse(localStorage.getItem("pod_parcels") || "[]");
    setShipments(localData);
  }, []);

  useEffect(() => {
    window.addEventListener("storage_updated", loadShipments);
    window.addEventListener("focus", loadShipments);

    return () => {
      window.removeEventListener("storage_updated", loadShipments);
      window.removeEventListener("focus", loadShipments);
    };
  }, [loadShipments]);

  const activeAlertsCount = notifications.filter(n => n.active).length;

  const dismissNotification = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, active: false } : n));
  };

  const handleSaveProfile = (updated: ReceiverProfile) => {
    setProfile(updated);
    localStorage.setItem("pod_receiver_profile", JSON.stringify(updated));
  };

  const generateSecurePin = (): string => {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return (100000 + (array[0] % 900000)).toString();
  };

  const handleTrackHash = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newTrack: Shipment = {
      id: `POD-${String(shipments.length + 1).padStart(3, "0")}`,
      sender: "External SME Merchant",
      item: "Synced Escrow Parcel",
      status: "Created",
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      hash: inputHash.length > 10 ? inputHash.substring(0, 6) + "..." + inputHash.substring(inputHash.length - 4) : inputHash,
      pin: generateSecurePin(),
      address: profile.address
    };

    const updated = [newTrack, ...shipments];
    localStorage.setItem("pod_parcels", JSON.stringify(updated));
    setShipments(updated);
    setInputHash('');
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
                <h3 className="font-extrabold text-slate-900 text-sm">Live Proximity Alerts</h3>
                <span className="text-[10px] font-bold bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full uppercase">Realtime</span>
              </div>
              {notifications.filter(n => n.active).length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No active package updates right now.</p>
              ) : (
                notifications.filter(n => n.active).map(n => (
                  <div key={n.id} className={`p-3 rounded-xl border flex gap-3 items-start ${n.type === 'proximity' ? 'bg-amber-50/70 border-amber-200 text-amber-900' : 'bg-teal-50/70 border-teal-200 text-teal-900'}`}>
                    {n.type === 'proximity' ? <Navigation size={16} className="text-amber-600 shrink-0 mt-0.5 animate-pulse" /> : <Package size={16} className="text-teal-600 shrink-0 mt-0.5" />}
                    <div className="flex-1">
                      <p className="text-xs font-semibold leading-relaxed">{n.message}</p>
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
                  <div className={`p-3 rounded-xl shrink-0 ${shipment.status === 'Delivered' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
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
                  {shipment.status !== 'Delivered' && (
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
                <label htmlFor="hash-in" className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Contract Hash String</label>
                <input id="hash-in" type="text" required value={inputHash} onChange={(e) => setInputHash(e.target.value)} placeholder="0x..." className="w-full p-3 font-mono text-sm border rounded-xl outline-none text-slate-900 bg-slate-50 focus:bg-white" />
              </div>
              <button type="submit" className="w-full bg-slate-950 hover:bg-slate-900 text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow shadow-slate-950/20 cursor-pointer">Sync Records</button>
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
        <VerifyRiderModal
          onClose={() => setIsVerifyRiderOpen(false)}
        />
      )}

      {isEditProfileOpen && (
        <EditReceiverProfileModal
          currentProfile={profile}
          onSave={handleSaveProfile}
          onClose={() => setIsEditProfileOpen(false)}
        />
      )}

      <BottomNavReceiver onCreateClick={() => setIsTrackModalOpen(true)} />
    </div>
  );
}