"use client";

import React, { useState } from 'react';
import { Wallet, ArrowUpRight, Truck, Package, Hash, X, Plus } from 'lucide-react';
import StatusBadge from '@/components/shared/StatusBadge';
import BottomNavSender from '@/components/navigation/BottomNavSender';
import { StatusType } from '@/components/shared/StatusBadge';

export default function SenderDashboard() {
  // 1. Core State tracking active escrow contracts
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [recentDeliveries, setRecentDeliveries] = useState([
    { id: "POD-001", item: "Groceries", address: "123 Royce Street, Cityville", timestamp: "2026-06-01 14:30", status: "Delivered" as StatusType, hash: "0x7a83...2c91", receiver: "0x111C...YU" },
    { id: "POD-002", item: "Groceries", address: "123 Item Street, Owerri", timestamp: "2026-06-01 14:30", status: "Delivered" as StatusType, hash: "0x4b12...ef84", receiver: "0x111C...YD" },
    { id: "POD-003", item: "Electronics", address: "789 Oak Ave, Villagetown", timestamp: "2026-06-02 10:15", status: "InTransit" as StatusType, hash: "0x9dca...33a1", receiver: "0x222D...AB" },
    { id: "POD-004", item: "Gadgets", address: "456 Elm St, Townsville", timestamp: "2026-06-03 09:00", status: "Created" as StatusType, hash: "Pending Escrow", receiver: "0x333E...CD" },
  ]);

  // Form Fields State
  const [newItem, setNewItem] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newReceiver, setNewReceiver] = useState('');

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newOrder = {
      id: `POD-00${recentDeliveries.length + 1}`,
      item: newItem,
      address: newAddress,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: "Created" as StatusType,
      hash: "Deploying Escrow...",
      receiver: newReceiver.substring(0, 6) + "..." + newReceiver.substring(newReceiver.length - 4)
    };

    setRecentDeliveries([newOrder, ...recentDeliveries]);
    setNewItem('');
    setNewAddress('');
    setNewReceiver('');
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 pb-32 max-w-7xl mx-auto font-sans antialiased">
      
      {/* HEADER SECTION */}
      <header className="border-b border-slate-200 pb-6 mb-6">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Sender Dashboard</h1>
        <p className="text-slate-500 text-sm font-medium mt-0.5">Your Blockchain-enabled Proof of Delivery framework</p>
      </header>

      {/* METRICS CARDS GRID */}
      <section className="grid gap-4 grid-cols-1 md:grid-cols-3 mb-8">
        {/* Card 1: Wallet Balance */}
        <div className="border border-slate-200 p-6 rounded-2xl bg-white shadow-xs flex justify-between items-start">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Wallet Balance</p>
            <h3 className="text-3xl font-black tracking-tight text-slate-900 mt-1">2.30 ETH</h3>
            <p className="text-xs text-emerald-600 font-semibold mt-2">+120.40 today</p>
          </div>
          <div className="p-3 bg-teal-50 rounded-xl text-teal-600"><Wallet size={24} /></div>
        </div>

        {/* Card 2: Funds in Escrow */}
        <div className="border border-slate-200 p-6 rounded-2xl bg-white shadow-xs flex justify-between items-start">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Funds in Escrow</p>
            <h3 className="text-3xl font-black tracking-tight text-slate-900 mt-1">0.85 ETH</h3>
            <p className="text-xs text-slate-500 font-medium mt-2">Locked until delivery confirmation</p>
          </div>
          <div className="p-3 bg-teal-50 rounded-xl text-teal-600"><ArrowUpRight size={24} /></div>
        </div>

        {/* Card 3: Active Deliveries */}
        <div className="border border-slate-200 p-6 rounded-2xl bg-white shadow-xs flex justify-between items-start">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Deliveries</p>
            <h3 className="text-3xl font-black tracking-tight text-slate-900 mt-1">
              {recentDeliveries.filter(d => d.status === "InTransit" || d.status === "Created").length}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-2">Consignments currently in transit</p>
          </div>
          <div className="p-3 bg-teal-50 rounded-xl text-teal-600"><Truck size={24} /></div>
        </div>
      </section>

      {/* RECENT DELIVERIES TABLE CONTAINER */}
      <section className="border border-slate-200 rounded-2xl bg-white shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-black tracking-tight text-slate-900 uppercase tracking-wide">Recent Shipments</h2>
          <p className="text-slate-500 text-xs font-medium mt-0.5">A real-time ledger history of your smart contract shipments</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-200">
                <th className="p-4">POD ID</th>
                <th className="p-4">Contents</th>
                <th className="p-4">Destination Address</th>
                <th className="p-4">Date</th>
                <th className="p-4">Status</th>
                <th className="p-4">Blockchain Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {recentDeliveries.map((delivery) => (
                <tr key={delivery.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-4 font-mono font-bold text-teal-600">{delivery.id}</td>
                  <td className="p-4 font-semibold text-slate-900">{delivery.item}</td>
                  <td className="p-4 max-w-xs truncate text-slate-500">{delivery.address}</td>
                  <td className="p-4 text-slate-500">{delivery.timestamp}</td>
                  <td className="p-4">
                    <StatusBadge status={delivery.status} />
                  </td>
                  <td className="p-4 font-mono text-xs">
                    <span className="bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 inline-flex items-center gap-1 text-slate-500">
                      <Hash size={12} className="text-slate-400" /> {delivery.hash}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* INITIALIZE ESCROW FORM OVERLAY MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl relative z-50 animate-in zoom-in-95 duration-200">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-lg font-black tracking-tight text-slate-900">Initialize Smart Contract Escrow</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitOrder} className="space-y-4">
              <div>
                <label htmlFor="item-desc" className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Item Description</label>
                <input id="item-desc" type="text" required value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder="e.g., Organic Cosmetics Kit" className="w-full p-3 border rounded-xl outline-none text-slate-900 bg-slate-50 focus:bg-white focus:border-teal-500 transition-all text-sm" />
              </div>
              <div>
                <label htmlFor="dest-addr" className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Delivery Destination Address</label>
                <input id="dest-addr" type="text" required value={newAddress} onChange={(e) => setNewAddress(e.target.value)} placeholder="e.g., 14 Douglas Road, Owerri" className="w-full p-3 border rounded-xl outline-none text-slate-900 bg-slate-50 focus:bg-white focus:border-teal-500 transition-all text-sm" />
              </div>
              <div>
                <label htmlFor="rec-wallet" className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Receiver Wallet Target (0x...)</label>
                <input id="rec-wallet" type="text" required value={newReceiver} onChange={(e) => setNewReceiver(e.target.value)} placeholder="0x..." className="w-full p-3 border rounded-xl font-mono outline-none text-slate-900 bg-slate-50 focus:bg-white focus:border-teal-500 transition-all text-sm" />
              </div>
              <button type="submit" className="w-full bg-slate-950 hover:bg-slate-900 text-white font-bold py-3.5 rounded-xl text-sm shadow transition-all mt-2">
                Lock Escrow & Deploy Transaction
              </button>
            </form>

          </div>
        </div>
      )}

      {/* SINGLE ISOLATED BOTTOM NAVIGATION SYSTEM BAR */}
      <BottomNavSender onCreateClick={() => setIsModalOpen(true)} />

    </div>
  );
}