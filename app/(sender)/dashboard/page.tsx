"use client";

import React, { useState, useEffect } from "react";
import {
  Wallet,
  ArrowUpRight,
  Truck,
  Hash,
  X,
  Filter,
} from "lucide-react";
import StatusBadge, { StatusType } from "@/components/shared/StatusBadge";
import BottomNavSender from "@/components/navigation/BottomNavSender";
import MobileWalletConnect from "@/components/wallet/MobileWalletConnect";

interface DeliveryItem {
  id: string;
  item: string;
  address: string;
  timestamp: string;
  status: StatusType;
  hash: string;
  receiver: string;
}

const INITIAL_DELIVERIES: DeliveryItem[] = [
  {
    id: "POD-001",
    item: "Groceries",
    address: "123 Royce Street, Cityville",
    timestamp: "2026-06-01 14:30",
    status: "Delivered",
    hash: "0x7a83...2c91",
    receiver: "0x111C...YU",
  },
  {
    id: "POD-002",
    item: "Groceries",
    address: "123 Item Street, Owerri",
    timestamp: "2026-06-01 14:30",
    status: "Delivered",
    hash: "0x4b12...ef84",
    receiver: "0x111C...YD",
  },
  {
    id: "POD-003",
    item: "Electronics",
    address: "789 Oak Ave, Villagetown",
    timestamp: "2026-06-02 10:15",
    status: "InTransit",
    hash: "0x9dca...33a1",
    receiver: "0x222D...AB",
  },
  {
    id: "POD-004",
    item: "Gadgets",
    address: "456 Elm St, Townsville",
    timestamp: "2026-06-03 09:00",
    status: "Created",
    hash: "Pending Escrow",
    receiver: "0x333E...CD",
  },
];

export default function SenderDashboard() {
  const [isSeeAllOpen, setIsSeeAllOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Deliveries state with Lazy Initialization from localStorage
  const [recentDeliveries, setRecentDeliveries] = useState<DeliveryItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("pod_recent_deliveries");
        if (saved) return JSON.parse(saved) as DeliveryItem[];
      } catch (e) {
        console.error("Storage load error", e);
      }
    }
    return INITIAL_DELIVERIES;
  });
  
  
  // Keep filtered list in sync with main deliveries
  const [filteredDeliveries, setFilteredDeliveries] = useState<DeliveryItem[]>(recentDeliveries);

  // Save deliveries to localStorage whenever updated
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("pod_recent_deliveries", JSON.stringify(recentDeliveries));
      } catch (e) {
        console.error("Storage save error", e);
      }
    }
  }, [recentDeliveries]);

  // Date range filter state for "See All" modal
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Form Fields State
  const [newItem, setNewItem] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newReceiver, setNewReceiver] = useState("");

  const filterDeliveries = (deliveries: DeliveryItem[]) => {
    let result = [...deliveries];

    if (startDate) {
      result = result.filter((d) => d.timestamp >= startDate);
    }
    if (endDate) {
      result = result.filter((d) => d.timestamp <= `${endDate} 23:59`);
    }

    return result;
  };

  // Handle Date Range Filtering
  const handleFilterByDate = () => {
    setFilteredDeliveries(filterDeliveries(recentDeliveries));
  };

  const handleResetFilter = () => {
    setStartDate("");
    setEndDate("");
    setFilteredDeliveries(recentDeliveries);
  };

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();

    const newOrder: DeliveryItem = {
      id: `POD-00${recentDeliveries.length + 1}`,
      item: newItem,
      address: newAddress,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
      status: "Created",
      hash: "Deploying Escrow...",
      receiver:
        newReceiver.length > 10
          ? newReceiver.substring(0, 6) + "..." + newReceiver.substring(newReceiver.length - 4)
          : newReceiver,
    };

    const updatedDeliveries = [newOrder, ...recentDeliveries];
    setRecentDeliveries(updatedDeliveries);
    setFilteredDeliveries(
      startDate || endDate ? filterDeliveries(updatedDeliveries) : updatedDeliveries
    );

    setNewItem("");
    setNewAddress("");
    setNewReceiver("");
    setIsModalOpen(false);
  };
// Adding a state for image file and IPFS status
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [ipfsCid, setIpfsCid] = useState<string>("");
  const [isUpload, setIsUpload] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files && e.target.files[0]) {
    const file = e.target.files[0];
    setSelectedFile(file);
    setImagePreview(URL.createObjectURL(file));
  }
};
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 pb-32 max-w-7xl mx-auto font-sans antialiased">
      {/* HEADER SECTION */}
      <header className="border-b border-slate-200 pb-6 mb-6">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">
          Sender Dashboard
        </h1>
        <p className="text-slate-500 text-sm font-medium mt-0.5">
          Your Blockchain-enabled Proof of Delivery framework
        </p>
      </header>

      <MobileWalletConnect />

      {/* METRICS CARDS GRID */}
      <section className="grid gap-4 grid-cols-1 md:grid-cols-3 mb-8">
        {/* Card 1: Wallet Balance */}
        <div className="border border-slate-200 p-6 rounded-2xl bg-white shadow-xs flex justify-between items-start">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Wallet Balance
            </p>
            <h3 className="text-3xl font-black tracking-tight text-slate-900 mt-1">
              2.30 ETH
            </h3>
            <p className="text-xs text-emerald-600 font-semibold mt-2">
              +120.40 today
            </p>
          </div>
          <div className="p-3 bg-teal-50 rounded-xl text-teal-600">
            <Wallet size={24} />
          </div>
        </div>

        {/* Card 2: Funds in Escrow */}
        <div className="border border-slate-200 p-6 rounded-2xl bg-white shadow-xs flex justify-between items-start">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Funds in Escrow
            </p>
            <h3 className="text-3xl font-black tracking-tight text-slate-900 mt-1">
              0.85 ETH
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-2">
              Locked until delivery confirmation
            </p>
          </div>
          <div className="p-3 bg-teal-50 rounded-xl text-teal-600">
            <ArrowUpRight size={24} />
          </div>
        </div>

        {/* Card 3: Active Deliveries */}
        <div className="border border-slate-200 p-6 rounded-2xl bg-white shadow-xs flex justify-between items-start">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Active Deliveries
            </p>
            <h3 suppressHydrationWarning className="text-3xl font-black tracking-tight text-slate-900 mt-1">
              {
                recentDeliveries.filter(
                  (d) => d.status === "InTransit" || d.status === "Created"
                ).length
              }
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-2">
              Consignments currently in transit
            </p>
          </div>
          <div className="p-3 bg-teal-50 rounded-xl text-teal-600">
            <Truck size={24} />
          </div>
        </div>
      </section>

      {/* RECENT DELIVERIES TABLE CONTAINER */}
      <section className="border border-slate-200 rounded-2xl bg-white shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-900 uppercase tracking-wide">
              Recent Shipments
            </h2>
            <p className="text-slate-500 text-xs font-medium mt-0.5">
              A real-time ledger history of your smart contract shipments
            </p>
          </div>

          {/* SEE ALL TRIGGER BUTTON */}
          <button
            type="button"
            onClick={() => setIsSeeAllOpen(true)}
            className="flex items-center gap-1 text-xs font-bold text-teal-600 hover:text-teal-700 transition cursor-pointer"
          >
            See All <ArrowUpRight size={14} />
          </button>
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
              {recentDeliveries.slice(0, 5).map((delivery) => (
                <tr
                  key={delivery.id}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  <td className="p-4 font-mono font-bold text-teal-600">
                    {delivery.id}
                  </td>
                  <td className="p-4 font-semibold text-slate-900">
                    {delivery.item}
                  </td>
                  <td className="p-4 max-w-xs truncate text-slate-500">
                    {delivery.address}
                  </td>
                  <td className="p-4 text-slate-500">{delivery.timestamp}</td>
                  <td className="p-4">
                    <StatusBadge status={delivery.status} />
                  </td>
                  <td className="p-4 font-mono text-xs">
                    <span className="bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 inline-flex items-center gap-1 text-slate-500">
                      <Hash size={12} className="text-slate-400" />{" "}
                      {delivery.hash}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ================= SEE ALL DELIVERIES & DATE FILTER MODAL ================= */}
      {isSeeAllOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl relative z-50 flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-lg font-black tracking-tight text-slate-900">
                  All Shipment Records
                </h3>
                <p className="text-xs text-slate-500">
                  Filter and view complete ledger history
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSeeAllOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Date Range Controls */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4 flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="p-2 border rounded-lg bg-white text-xs outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="p-2 border rounded-lg bg-white text-xs outline-none focus:border-teal-500"
                />
              </div>

              <button
                type="button"
                onClick={handleFilterByDate}
                className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold px-3.5 py-2 rounded-lg text-xs transition-colors cursor-pointer"
              >
                <Filter size={14} /> Filter
              </button>

              {(startDate || endDate) && (
                <button
                  type="button"
                  onClick={handleResetFilter}
                  className="text-xs text-slate-500 hover:text-slate-800 underline pb-2 cursor-pointer"
                >
                  Reset Filter
                </button>
              )}
            </div>

            {/* Table */}
            <div className="overflow-y-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-white border-b border-slate-200 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <tr>
                    <th className="p-3">POD ID</th>
                    <th className="p-3">Contents</th>
                    <th className="p-3">Destination</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Hash</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {filteredDeliveries.map((delivery) => (
                    <tr
                      key={delivery.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="p-3 font-mono font-bold text-teal-600">
                        {delivery.id}
                      </td>
                      <td className="p-3 font-semibold text-slate-900">
                        {delivery.item}
                      </td>
                      <td className="p-3 text-slate-500">{delivery.address}</td>
                      <td className="p-3 text-slate-500">
                        {delivery.timestamp}
                      </td>
                      <td className="p-3">
                        <StatusBadge status={delivery.status} />
                      </td>
                      <td className="p-3 font-mono text-[11px] text-slate-400">
                        {delivery.hash}
                      </td>
                    </tr>
                  ))}
                  {filteredDeliveries.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center py-8 text-slate-400 text-xs"
                      >
                        No shipments found matching the selected dates.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* INITIALIZE ESCROW FORM OVERLAY MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl relative z-50 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-lg font-black tracking-tight text-slate-900">
                Initialize Smart Contract Escrow
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitOrder} className="space-y-4">
              <div>
                <label
                  htmlFor="item-desc"
                  className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1"
                >
                  Item Description
                </label>
                <input
                  id="item-desc"
                  type="text"
                  required
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  placeholder="e.g., Organic Cosmetics Kit"
                  className="w-full p-3 border rounded-xl outline-none text-slate-900 bg-slate-50 focus:bg-white focus:border-teal-500 transition-all text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="dest-addr"
                  className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1"
                >
                  Delivery Destination Address
                </label>
                <input
                  id="dest-addr"
                  type="text"
                  required
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="e.g., 14 Douglas Road, Owerri"
                  className="w-full p-3 border rounded-xl outline-none text-slate-900 bg-slate-50 focus:bg-white focus:border-teal-500 transition-all text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="rec-wallet"
                  className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1"
                >
                  Receiver Wallet Target (0x...)
                </label>
                <input
                  id="rec-wallet"
                  type="text"
                  required
                  value={newReceiver}
                  onChange={(e) => setNewReceiver(e.target.value)}
                  placeholder="0x..."
                  className="w-full p-3 border rounded-xl font-mono outline-none text-slate-900 bg-slate-50 focus:bg-white focus:border-teal-500 transition-all text-sm"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-slate-950 hover:bg-slate-900 text-white font-bold py-3.5 rounded-xl text-sm shadow transition-all mt-2 cursor-pointer"
              >
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