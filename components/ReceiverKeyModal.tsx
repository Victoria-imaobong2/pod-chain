"use client";

import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Check, Copy, X } from "lucide-react";

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
  const [copied, setCopied] = useState(false);

  if (!parcel) return null;

  const pinCode = parcel.pin || "------";
  const qrData = `POD_PARCEL:${parcel.hash || ""}|PIN:${pinCode}`;

  const handleCopy = () => {
    if (parcel.pin) {
      navigator.clipboard.writeText(parcel.pin);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <dialog
      open
      aria-labelledby="delivery-modal-title"
      className="fixed inset-0 z-50 m-0 flex h-full w-full max-h-none max-w-none items-center justify-center bg-transparent p-4 border-none animate-in fade-in overflow-hidden"
    >
      {/* Semantic Backdrop Overlay */}
      <button
        type="button"
        aria-label="Close modal overlay"
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm cursor-default border-none"
      />

      {/* Modal Dialog Content */}
      <div className="relative z-10 bg-white rounded-2xl p-6 max-w-sm w-full space-y-5 text-center shadow-2xl border border-slate-200 animate-in zoom-in-95">
        <div className="flex justify-between items-center border-b pb-3">
          <h3 id="delivery-modal-title" className="font-bold text-slate-900 text-lg">
            🔑 Delivery Verification
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        <div>
          <p className="text-xs text-teal-600 font-semibold uppercase tracking-wider">{parcel.id}</p>
          <h4 className="text-xl font-extrabold text-slate-900 mt-0.5">{parcel.item || "Package Item"}</h4>
        </div>

        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 space-y-2">
          <p className="text-xs text-teal-800 font-medium">Your 6-Digit Secret OTP PIN</p>
          <div className="flex items-center justify-center gap-2">
            <h2 className="text-3xl font-black text-teal-700 tracking-widest font-mono">{pinCode}</h2>
            {parcel.pin && (
              <button
                type="button"
                onClick={handleCopy}
                className="p-1.5 hover:bg-teal-100 rounded-lg text-teal-700 transition cursor-pointer"
                title="Copy PIN"
              >
                {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
              </button>
            )}
          </div>
          <p className="text-[11px] text-teal-600">Provide this to the rider or let them scan the QR code below.</p>
        </div>

        <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-slate-200 shadow-inner">
          <QRCodeSVG value={qrData} size={180} level="M" marginSize={2} />
          <p className="text-[10px] text-slate-400 mt-2 font-mono">Scan via Courier Terminal</p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition cursor-pointer"
        >
          Done
        </button>
      </div>
    </dialog>
  );
}