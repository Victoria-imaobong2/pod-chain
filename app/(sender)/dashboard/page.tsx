"use client";

import React, { useState, useEffect, useCallback, useMemo, useSyncExternalStore } from "react";
import {
  Wallet,
  ArrowUpRight,
  Truck,
  Hash,
  X,
} from "lucide-react";
import StatusBadge from "@/components/shared/StatusBadge";
import BottomNavSender from "@/components/navigation/BottomNavSender";
import MobileWalletConnect from "@/components/wallet/MobileWalletConnect";
import { API_BASE_URL } from "@/lib/config";

interface BackendParcelItem {
  id: number | string;
  tracking_number?: string;
  contents_name?: string;
  destination_address?: string;
  created_at?: string;
  status?: "Created" | "InTransit" | "Delivered";
  tx_hash?: string;
  receiver_address?: string;
  receiver_phone?: string;
  proximity_checkpoint?: string;
}

export interface DeliveryItem {
  id: string | number;
  tracking_number?: string;
  item?: string;
  contents_name?: string;
  address?: string;
  destination_address?: string;
  timestamp?: string;
  created_at?: string;
  status: "Created" | "InTransit" | "Delivered";
  hash?: string;
  tx_hash?: string;
  receiver?: string;
  proximity_checkpoint?: string;
}

const subscribe = () => () => {};

export default function SenderDashboard() {
  const isClient = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );

  const [isSeeAllOpen, setIsSeeAllOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [recentDeliveries, setRecentDeliveries] = useState<DeliveryItem[]>([]);

  // Date range filter state
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Form Fields State
  const [newItem, setNewItem] = useState("");
  const [newAddress, setNewAddress] = useState("");

  const fetchDeliveries = useCallback(async (): Promise<DeliveryItem[]> => {
    try {
      const baseUrl = API_BASE_URL || "https://podchain-backend.onrender.com";
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("token") || localStorage.getItem("access_token")
          : null;

      const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const res = await fetch(`${baseUrl}/api/v1/parcels`, { headers });
      if (res.ok) {
        const data = await res.json();
        const parcelList: BackendParcelItem[] = Array.isArray(data)
          ? data
          : data.parcels || [];

        if (parcelList.length > 0) {
          return parcelList.map((p) => ({
            id: p.tracking_number || `POD-${p.id}`,
            item: p.contents_name || "General Goods",
            address: p.destination_address || "Owerri",
            timestamp: p.created_at
              ? p.created_at.replace("T", " ").substring(0, 16)
              : new Date().toISOString().substring(0, 10),
            status: p.status || "Created",
            hash: p.tx_hash
              ? `${p.tx_hash.substring(0, 6)}...${p.tx_hash.slice(-4)}`
              : "0xPending...",
            receiver: p.receiver_address || p.receiver_phone || "N/A",
            proximity_checkpoint: p.proximity_checkpoint,
          }));
        }
      }

      // Fallback: Check local storage cache if backend returned empty
      const localData =
        typeof window !== "undefined" ? localStorage.getItem("pod_deliveries") : null;
      if (localData) {
        return JSON.parse(localData);
      }

      return [];
    } catch (err) {
      console.error("Sender dashboard auto-sync failed:", err);
      return [];
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const runSync = async () => {
      const data = await fetchDeliveries();
      if (isMounted && data.length > 0) {
        setRecentDeliveries(data);
      }
    };

    void runSync();
    // Poll every 8 seconds instead of 3 to avoid spamming the backend
    const interval = setInterval(() => {
      void runSync();
    }, 8000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [fetchDeliveries]);

  // Derived filtered deliveries computed with useMemo
  const filteredDeliveries = useMemo(() => {
    let result = [...recentDeliveries];
    if (startDate) {
      result = result.filter((d) => (d.timestamp || "") >= startDate);
    }
    if (endDate) {
      result = result.filter((d) => (d.timestamp || "") <= `${endDate} 23:59`);
    }
    return result;
  }, [recentDeliveries, startDate, endDate]);

  const handleResetFilter = () => {
    setStartDate("");
    setEndDate("");
  };

  const handleSubmitOrder = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsModalOpen(false);
  };

  if (!isClient) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Truck size={36} className="text-teal-600 animate-pulse" />
      </div>
    );
  }

  const activeDeliveriesCount = recentDeliveries.filter(
    (d) => d.status === "InTransit" || d.status === "Created"
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 pb-32 max-w-7xl mx-auto font-sans antialiased">
      <header className="border-b border-slate-200 pb-6 mb-6">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">
          Sender Dashboard
        </h1>
        <p className="text-slate-500 text-sm font-medium mt-0.5">
          Real-time decentralized shipment ledger and escrow monitor
        </p>
      </header>

      <div className="mb-6">
        <MobileWalletConnect />
      </div>

      <section className="grid gap-4 grid-cols-1 md:grid-cols-3 mb-8">
        <div className="border border-slate-200 p-6 rounded-2xl bg-white shadow-xs flex justify-between items-start">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Total Shipments
            </p>
            <h3 className="text-3xl font-black tracking-tight text-slate-900 mt-1">
              {recentDeliveries.length}
            </h3>
            <p className="text-xs text-emerald-600 font-semibold mt-2">
              Synced with Blockchain
            </p>
          </div>
          <div className="p-3 bg-teal-50 rounded-xl text-teal-600">
            <Wallet size={24} />
          </div>
        </div>

        <div className="border border-slate-200 p-6 rounded-2xl bg-white shadow-xs flex justify-between items-start">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Active Deliveries
            </p>
            <h3 className="text-3xl font-black tracking-tight text-slate-900 mt-1">
              {activeDeliveriesCount}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-2">
              In transit or awaiting pickup
            </p>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
            <Truck size={24} />
          </div>
        </div>

        <div className="border border-slate-200 p-6 rounded-2xl bg-white shadow-xs flex justify-between items-start">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Completed Handoffs
            </p>
            <h3 className="text-3xl font-black tracking-tight text-emerald-600 mt-1">
              {recentDeliveries.filter((d) => d.status === "Delivered").length}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-2">
              Escrow released & verified
            </p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <ArrowUpRight size={24} />
          </div>
        </div>
      </section>

      <section className="border border-slate-200 rounded-2xl bg-white shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-900 uppercase">
              Recent Shipments
            </h2>
            <p className="text-slate-500 text-xs font-medium mt-0.5">
              Updates in real-time as couriers move and verify deliveries
            </p>
          </div>

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
                <th className="p-4">Tracking ID</th>
                <th className="p-4">Contents</th>
                <th className="p-4">Destination</th>
                <th className="p-4">Telemetry / Checkpoint</th>
                <th className="p-4">Status</th>
                <th className="p-4">Escrow Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {recentDeliveries.slice(0, 6).map((delivery) => (
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
                  <td className="p-4">
                    {delivery.proximity_checkpoint ? (
                      <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                        {delivery.proximity_checkpoint}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Awaiting dispatch</span>
                    )}
                  </td>
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
              {recentDeliveries.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400 text-xs">
                    No shipments found. Create your first delivery to track it here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* SEE ALL MODAL */}
      {isSeeAllOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl relative z-50 flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-lg font-black tracking-tight text-slate-900">
                  All Shipment Records
                </h3>
                <p className="text-xs text-slate-500">
                  Filter and view live ledger status
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSeeAllOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Date Filters */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4 flex flex-wrap items-end gap-3">
              <div>
                <label
                  htmlFor="filter-start-date"
                  className="block text-[10px] font-bold uppercase text-slate-500 mb-1"
                >
                  Start Date
                </label>
                <input
                  id="filter-start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="p-2 border rounded-lg bg-white text-xs outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label
                  htmlFor="filter-end-date"
                  className="block text-[10px] font-bold uppercase text-slate-500 mb-1"
                >
                  End Date
                </label>
                <input
                  id="filter-end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="p-2 border rounded-lg bg-white text-xs outline-none focus:border-teal-500"
                />
              </div>

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
                    <th className="p-3">Tracking ID</th>
                    <th className="p-3">Contents</th>
                    <th className="p-3">Destination</th>
                    <th className="p-3">Checkpoint</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Escrow Hash</th>
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
                      <td className="p-3">
                        <span className="text-[11px] font-semibold text-amber-700">
                          {delivery.proximity_checkpoint || "—"}
                        </span>
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
                        No shipments found matching the criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TRIGGER */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl relative z-50">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-lg font-black tracking-tight text-slate-900">
                Create New Escrow Delivery
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
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
                  className="w-full p-3 border rounded-xl outline-none text-slate-900 bg-slate-50 text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="dest-addr"
                  className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1"
                >
                  Destination Address
                </label>
                <input
                  id="dest-addr"
                  type="text"
                  required
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="e.g., 14 Douglas Road, Owerri"
                  className="w-full p-3 border rounded-xl outline-none text-slate-900 bg-slate-50 text-sm"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-slate-950 hover:bg-slate-900 text-white font-bold py-3.5 rounded-xl text-sm shadow transition-all mt-2 cursor-pointer"
              >
                Confirm
              </button>
            </form>
          </div>
        </div>
      )}

      <BottomNavSender onCreateClick={() => setIsModalOpen(true)} />
    </div>
  );
}