"use client";

import React from "react";
import { Navigation, Phone, User, ShieldCheck, MapPin, AlertCircle } from "lucide-react";

export interface ActiveTransitParcel {
  id: string;
  item?: string;
  courierName?: string;
  courierPhone?: string;
  hash?: string;
  address?: string;
  status?: string;
}

interface CourierProximityModalProps {
  readonly activeParcels: ActiveTransitParcel[];
  readonly onClose: () => void;
}

export default function CourierProximityModal({
  activeParcels,
  onClose,
}: CourierProximityModalProps) {
  const primaryParcel = activeParcels[0];

  const hasAssignedCourier = Boolean(
    primaryParcel?.courierName || primaryParcel?.courierPhone
  );

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-5 shadow-2xl border animate-in zoom-in-95">
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-3">
          <div className="flex items-center gap-2">
            <Navigation className="text-teal-600 animate-pulse" size={22} />
            <div>
              <h3 className="font-black text-slate-900 text-lg">Live Delivery Radar</h3>
              <p className="text-[11px] text-slate-400 font-medium">Real-time courier proximity tracking</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold text-xl cursor-pointer"
          >
            ✕
          </button>
        </div>

        {!primaryParcel ? (
          <div className="p-8 text-center space-y-2 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <AlertCircle size={28} className="mx-auto text-slate-400" />
            <p className="font-bold text-slate-700 text-sm">No Active Incoming Shipments</p>
            <p className="text-xs text-slate-400">When an order is created or dispatched, tracking data will stream here.</p>
          </div>
        ) : (
          <>
            {/* Dynamic Courier Details Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                    {primaryParcel.id}
                  </span>
                  <h4 className="font-extrabold text-slate-900 text-base mt-1">
                    {primaryParcel.item || "Escrow Shipment"}
                  </h4>
                </div>
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                  <ShieldCheck size={14} /> Escrow Active
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <User size={16} className="text-teal-600 shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Courier Name</p>
                    <p className={`font-bold ${hasAssignedCourier ? "text-slate-900" : "text-amber-600 italic"}`}>
                      {primaryParcel.courierName || "Unassigned Rider"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-slate-700">
                  <Phone size={16} className="text-teal-600 shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Contact</p>
                    <p className={`font-bold ${hasAssignedCourier ? "text-slate-900" : "text-amber-600 italic"}`}>
                      {primaryParcel.courierPhone || "Pending Acceptance"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Proximity / Assignment Banner */}
            <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
              hasAssignedCourier ? "bg-amber-50 border-amber-200 text-amber-900" : "bg-blue-50 border-blue-200 text-blue-900"
            }`}>
              <div className="flex items-center gap-2">
                <MapPin size={18} className={`${hasAssignedCourier ? "text-amber-600 animate-bounce" : "text-blue-600"}`} />
                <span>
                  {hasAssignedCourier ? (
                    <>Courier is approx. <strong>0.8 km away</strong> (Estimated arrival: 6 mins)</>
                  ) : (
                    <>Waiting for courier to accept assignment in dispatch terminal...</>
                  )}
                </span>
              </div>
            </div>

            {/* Simulated Map Container */}
            <div className="relative w-full h-44 bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden flex flex-col items-center justify-center text-center p-4">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#0d9488_1px,transparent_1px)] bg-[size:16px_16px]" />
              <div className="z-10 space-y-2">
                <div className="w-10 h-10 bg-teal-600 text-white rounded-full flex items-center justify-center mx-auto shadow-lg animate-pulse">
                  <Navigation size={20} />
                </div>
                <p className="text-xs font-bold text-slate-800">Route Map Synchronized</p>
                <p className="text-[11px] text-slate-500 max-w-xs">
                  {hasAssignedCourier ? `Telemetry active for ${primaryParcel.courierName}` : "Waiting for rider dispatch telemetry"}
                </p>
              </div>
            </div>
          </>
        )}

        <button
          type="button"
          onClick={onClose}
          className="w-full bg-slate-900 hover:bg-black text-white font-bold py-3 rounded-xl text-sm transition cursor-pointer"
        >
          Close Tracking View
        </button>
      </div>
    </div>
  );
}