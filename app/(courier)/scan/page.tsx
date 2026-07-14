"use client";

import React, { useState } from 'react';
import { Truck, MapPin, QrCode, Navigation, CheckCircle2, Package, Eye, X, Award, ShieldCheck } from 'lucide-react';
import StatusBadge from '@/components/shared/StatusBadge';
import BottomNavCourier from '@/components/navigation/BottomNavCourier';

export default function CourierDashboard() {
  // 1. Mocking Available and Active Courier Manifests
  const [activeJobs, setActiveJobs] = useState([
    { id: "POD-003", merchant: "Owerri Cosmetics Co.", item: "Premium Skincare Batch", status: "InTransit", pickup: "No 88 Wetheral Road, Owerri", dropoff: "No 14 Douglas Road, Owerri", escrowReward: "0.05 ETH" },
    { id: "POD-004", merchant: "Tech Hub Gadgets", item: "M4 Mechanical Keyboard", status: "Pending", pickup: "Alaba Int'l Market, Lagos", dropoff: "No 3 Nekede Close, Owerri", escrowReward: "0.08 ETH" }
  ]);

  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannedKeyInput, setScannedKeyInput] = useState('');
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Simulating picking up a package from the merchant terminal
  const handleStartTransit = (jobId: string) => {
    setActiveJobs(prev => prev.map(job => 
      job.id === jobId ? { ...job, status: "InTransit" } : job
    ));
    setSuccessBanner(`Package ${jobId} signed from merchant wallet. Transit path logged to ledger.`);
  };

  // Simulating scanning the receiver's handheld QR / inputting OTP matching validation
  const handleVerifyDeliveryHandshake = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedKeyInput.trim()) return;

    // Simulate verification check matching the receiver's OTP secret seed (e.g., '7F9A2B')
    const targetedJob = selectedJob || activeJobs[0];
    
    // Mutate local state array to 'Delivered' status
    setActiveJobs(prev => prev.map(job => 
      job.id === targetedJob.id ? { ...job, status: "Delivered" } : job
    ));

    setSuccessBanner(`Verification Success! Escrow milestone unlocked: ${targetedJob.escrowReward} transferred to your courier nodes.`);
    setIsScannerOpen(false);
    setSelectedJob(null);
    setScannedKeyInput('');
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 pb-32 max-w-7xl mx-auto font-sans antialiased">
      
      {/* HEADER SECTION */}
      <header className="border-b border-slate-200 pb-6 mb-6">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Courier Terminal</h1>
        <p className="text-slate-500 text-sm font-medium mt-0.5">Automated Decentralized Trustless Escrow Settlements</p>
      </header>

      {/* IMMUTABLE SETTLEMENT SUCCESS MESSAGE */}
      {successBanner && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl flex items-start gap-3 animate-in fade-in zoom-in-95 duration-200">
          <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <p className="text-sm font-bold">{successBanner}</p>
          </div>
          <button onClick={() => setSuccessBanner(null)} className="text-emerald-400 hover:text-emerald-600 font-bold text-xs">Dismiss</button>
        </div>
      )}

      {/* COURIER METRICS OVERVIEW */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Escrow Earned</span>
            <h3 className="text-2xl font-black tracking-tight text-teal-400 mt-1">0.42 ETH</h3>
          </div>
          <Award size={36} className="text-teal-500 opacity-80" />
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Runs Logs</span>
            <h3 className="text-2xl font-black tracking-tight text-slate-900 mt-1">18 Completed</h3>
          </div>
          <Truck size={36} className="text-slate-400" />
        </div>
      </section>

      {/* ACTIVE MANIFEST SHEET JOBS LIST */}
      <main className="space-y-4">
        <h2 className="text-xs font-black tracking-widest text-slate-400 uppercase">Assigned Manifest Shipments</h2>

        {activeJobs.map((job) => (
          <section key={job.id} className="bg-white p-5 border border-slate-200 rounded-2xl shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:shadow-md transition-all">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${job.status === 'Delivered' ? 'bg-emerald-50 text-emerald-600' : job.status === 'InTransit' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                  <Package size={22} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">{job.item}</h3>
                  <p className="text-xs text-slate-400">Merchant: {job.merchant} • <span className="font-mono font-bold">{job.id}</span></p>
                </div>
                <StatusBadge status={job.status as any} />
              </div>

              {/* ROUTING SPECIFICATIONS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-slate-400 shrink-0" />
                  <span><strong className="text-slate-700">Pickup:</strong> {job.pickup}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Navigation size={14} className="text-teal-600 shrink-0" />
                  <span><strong className="text-slate-700">Dropoff:</strong> {job.dropoff}</span>
                </div>
              </div>
            </div>

            {/* ACTION TRIGGERS INLINE CONTROL */}
            <div className="flex sm:items-center justify-between lg:justify-end gap-4 border-t lg:border-t-0 pt-4 lg:pt-0">
              <div>
                <span className="block text-[10px] font-bold uppercase text-slate-400">Payout Allocation</span>
                <span className="font-mono font-black text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-sm border">{job.escrowReward}</span>
              </div>

              {job.status === 'Pending' && (
                <button 
                  onClick={() => handleStartTransit(job.id)}
                  className="px-4 py-2 bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow transition-all"
                >
                  Accept Pickup Cargo
                </button>
              )}

              {job.status === 'InTransit' && (
                <button 
                  onClick={() => {
                    setSelectedJob(job);
                    setIsScannerOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition-all"
                >
                  <QrCode size={14} /> Scan Handoff Key
                </button>
              )}
            </div>
          </section>
        ))}
      </main>

      {/* MOCK HARDWARE CAMERA SCANNER INTERCEPTOR MODAL */}
      {isScannerOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 border shadow-2xl text-center">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="font-black text-slate-900 text-base">Handoff Validation Scanner</h3>
              <button onClick={() => { setIsScannerOpen(false); setSelectedJob(null); }} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>

            <p className="text-xs text-slate-500 mb-4 leading-normal">
              Scan the recipient's mobile credential string or enter the matching OTP block to close the escrow lifecycle parameter for job <span className="font-mono font-bold text-slate-800">{selectedJob?.id}</span>.
            </p>

            {/* RADAR RETICLE SIMULATOR WINDOW */}
            <div className="w-48 h-48 mx-auto border-2 border-blue-500 rounded-2xl bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden mb-4 p-4 shadow-inner group">
              <div className="absolute inset-x-0 h-0.5 bg-blue-400 shadow-md shadow-blue-500/80 animate-[bounce_3s_infinite]" />
              <QrCode size={48} className="text-blue-500/40" />
            </div>

            {/* MANUAL MANIFEST TEXT FALBACK INPUT */}
            <form onSubmit={handleVerifyDeliveryHandshake} className="space-y-3">
              <input 
                type="text" 
                required 
                maxLength={8}
                value={scannedKeyInput} 
                onChange={(e) => setScannedKeyInput(e.target.value.toUpperCase())}
                placeholder="Enter Code (e.g. 7F9A2B)" 
                className="w-full p-2.5 text-center font-mono text-sm tracking-widest uppercase border rounded-xl outline-none focus:border-blue-500 text-slate-900 bg-slate-50" 
              />
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs shadow transition-all">
                Validate Verification Key
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MOUNT COURIER ONLY SPECIFIC SYSTEM NAVIGATION */}
      <BottomNavCourier />
    </div>
  );
}