"use client";

import React from "react";
import { QRCodeSVG } from "qrcode.react";

interface ReceiverKeyModalProps {
  readonly parcel: {
    id: string;
    item?: string;
    hash?: string;
    pin?: string;
  } | null;
  readonly onClose: () => void;
}

export default function ReceiverKeyModal({ parcel, onClose }: ReceiverKeyModalProps) {
  if (!parcel) return null;

  const pinCode = parcel.pin || "369738";
  const qrData = `POD_PARCEL:${parcel.hash || ""}|PIN:${pinCode}`;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-5 text-center shadow-2xl border">
        <div className="flex justify-between items-center border-b pb-3">
          <h3 className="font-bold text-gray-800 text-lg">🔑 Delivery Verification</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 font-bold text-xl cursor-pointer">
            ✕
          </button>
        </div>

        <div>
          <p className="text-xs text-teal-600 font-semibold uppercase tracking-wider">{parcel.id}</p>
          <h4 className="text-xl font-extrabold text-gray-900 mt-0.5">{parcel.item || "Package Item"}</h4>
        </div>

        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
          <p className="text-xs text-teal-800 font-medium">Your 6-Digit Secret OTP PIN</p>
          <h2 className="text-3xl font-black text-teal-700 tracking-widest my-1 font-mono">{pinCode}</h2>
          <p className="text-[11px] text-teal-600">Provide this to the rider or let them scan the QR code below.</p>
        </div>

        <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl border shadow-inner">
          <QRCodeSVG value={qrData} size={180} level="M" marginSize={4} />
          <p className="text-[10px] text-gray-400 mt-2 font-mono">Scan via Courier Terminal</p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl text-sm font-semibold transition cursor-pointer"
        >
          Done
        </button>
      </div>
    </div>
  );
}