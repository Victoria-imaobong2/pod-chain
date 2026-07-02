"use client";

import React, { useState } from 'react';
import { Package, Bell, MapPin, QrCode, Clock, X, ShieldAlert, Navigation } from 'lucide-react';
import StatusBadge from '@/components/shared/StatusBadge';
import BottomNavReceiver from '@/components/navigation/BottomNavReceiver';

export default function ReceiverDashboard() {
  // 1. Live Shipments Array Focus (In Transit & Active workloads)
  const [shipments, setShipments] = useState([
    { id: "POD-003", sender: "Owerri Cosmetics Co.", item: "Premium Skincare Batch", status: "InTransit", timestamp: "2026-07-02 11:15", contractAddress: "0x7a83...2c91", secureOtp: "7F9A2B", destination: "No 14 Douglas Road, Owerri" },
    { id: "POD-007", sender: "Tech Hub Gadgets", item: "M4 Mechanical Keyboard", status: "Created", timestamp: "2026-07-02 14:20", contractAddress: "0x9dca...ef32", secureOtp: "9A1C5E", destination: "No 14 Douglas Road, Owerri" }
  ]);

  // 2. Specialized Proximity & Dispatch Alerts Feed state
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'proximity', message: 'Rider is nearby! POD-003 is less than 1km away from your destination.', active: true },
    { id: 2, type: 'dispatch', message: 'New consignment initialized: POD-007 has been securely locked in escrow.', active: true }
  ]);

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
  const [inputHash, setInputHash] = useState('');
  const [selectedOtp, setSelectedOtp] = useState<string | null>(null);

  const activeAlertsCount = notifications.filter(n => n.active).length;

  const dismissNotification = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, active: false } : n));
  };

  const handleTrackHash = (e: React.FormEvent) => {
    e.preventDefault();
    const newTrack = {
      id: `POD-00${shipments.length + 8}`,
      sender: "External SME Merchant",
      item: "Synced Escrow Parcel",
      status: "Created",
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      contractAddress: inputHash.substring(0, 6) + "..." + inputHash.substring(inputHash.length - 4),
      secureOtp: "4F8E2D",
      destination: "Verifying encrypted routing data..."
    };
    setShipments([newTrack, ...shipments]);
    setInputHash('');
    setIsTrackModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 pb-32 max-w-7xl mx-auto font-sans antialiased">
      
      {/* HEADER SECTION WITH ACTIVE NOTIFICATION CONTROLLER */}
      <header className="flex justify-between items-center border-b border-slate-200 pb-6 mb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Receiver Terminal</h1>
          <p className="text-slate-500 text-sm font-medium mt-0.5">Your monitored incoming blockchain shipments</p>
        </div>

        {/* NOTIFICATION TRIGGER BELL ICON */}
        <div className="relative">
          <button 
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            className="p-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-2xl shadow-xs transition-all relative active:scale-95"
          >
            <Bell size={22} className={activeAlertsCount > 0 ? "animate-bounce" : ""} />
            {activeAlertsCount > 0 && (
              <span className="absolute top-2 right-2 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                {activeAlertsCount}
              </span>
            )}
          </button>

          {/* DROP DOWN ALERTS OVERLAY FEED */}
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
                    <button onClick={() => dismissNotification(n.id)} className="text-slate-400 hover:text-slate-600 shrink-0"><X size={14} /></button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </header>

      {/* TWO COLUMN CONTENT STRUCTURE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* IN TRANSIT AND ACTIVE SHIPMENTS PANEL */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xs font-black tracking-widest text-slate-400 uppercase tracking-wide">Live Transit Ledger</h2>
          
          {shipments.map((shipment) => (
            <section key={shipment.id} className="bg-white p-6 border border-slate-200 rounded-2xl shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition-all">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl shrink-0 ${shipment.status === 'InTransit' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                  <Package size={26} />
                </div>
                <div>
                  <h3 className="font-extrabold tracking-tight text-slate-900 text-lg">{shipment.item}</h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Merchant: {shipment.sender} • ID: {shipment.id}</p>
                  <p className="text-[11px] font-mono text-slate-500 bg-slate-50 border px-1.5 py-0.5 rounded mt-2 w-fit">⛓️ Anchor: {shipment.contractAddress}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0">
                <StatusBadge status={shipment.status as any} />
                {shipment.status === 'InTransit' && (
                  <button 
                    onClick={() => setSelectedOtp(shipment.secureOtp)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
                  >
                    <QrCode size={12} /> Key
                  </button>
                )}
              </div>
            </section>
          ))}
        </div>

        {/* METADATA ROUTING SIDE PANEL */}
        <div className="space-y-4">
          <h2 className="text-xs font-black tracking-widest text-slate-400 uppercase tracking-wide">Registered Destination Profile</h2>
          <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="flex gap-3 items-start text-sm text-slate-700 leading-relaxed">
              <MapPin size={20} className="text-teal-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-900">Primary Delivery Point</p>
                <p className="text-xs text-slate-500 mt-1">No 14 Douglas Road, Owerri, Imo State, Nigeria.</p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* SECURE HANDSHAKE DISPLAY MODAL */}
      {selectedOtp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 text-center border shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="font-black text-slate-900 text-lg">Handoff Credentials</h3>
              <button onClick={() => setSelectedOtp(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <p className="text-xs text-slate-500 mb-4 leading-normal">Present this code token or let the rider scan the matrix link to unlock contract escrow assets.</p>
            <div className="w-44 h-44 mx-auto bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center justify-center gap-2 mb-2 p-4 shadow-inner">
              <QrCode size={64} className="text-slate-800 animate-pulse" />
              <span className="font-mono text-xl font-black tracking-widest text-slate-900 bg-slate-900 text-teal-400 px-3 py-1 rounded-xl shadow border border-slate-800">{selectedOtp}</span>
            </div>
          </div>
        </div>
      )}

      {/* TRACKING INTAKE OVERLAY POPUP */}
      {isTrackModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 border shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="font-black text-slate-900 text-lg">Track New Delivery Hash</h3>
              <button onClick={() => setIsTrackModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleTrackHash} className="space-y-4">
              <div>
                <label htmlFor="hash-in" className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Contract Hash String</label>
                <input id="hash-in" type="text" required value={inputHash} onChange={(e) => setInputHash(e.target.value)} placeholder="0x..." className="w-full p-3 font-mono text-sm border rounded-xl outline-none text-slate-900 bg-slate-50 focus:bg-white" />
              </div>
              <button type="submit" className="w-full bg-slate-950 hover:bg-slate-900 text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow shadow-slate-950/20">Sync Records</button>
            </form>
          </div>
        </div>
      )}

      {/* MOUNTING ISOLATED FUNCTIONAL NAVBAR */}
      <BottomNavReceiver onCreateClick={() => setIsTrackModalOpen(true)} />
    </div>
  );
}