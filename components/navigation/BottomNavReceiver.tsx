"use client";

import React from "react";
import Link from "next/link";
import { Package, Plus, QrCode, LogOut } from "lucide-react";

interface BottomNavReceiverProps {
  readonly onCreateClick: () => void;
  readonly onVerifyRiderClick: () => void;
}

export default function BottomNavReceiver({
  onCreateClick,
  onVerifyRiderClick,
}: BottomNavReceiverProps) {
  const handleLogout = () => {
    localStorage.removeItem("pod_user_role");
    window.location.href = "/";
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 py-2.5 px-6 flex justify-around items-center z-40 shadow-lg">
      <Link
        href="/receiver"
        className="flex flex-col items-center gap-0.5 text-slate-600 hover:text-teal-600 font-bold text-[10px] uppercase tracking-wider"
      >
        <Package size={20} />
        <span>My Packages</span>
      </Link>

      <button
        type="button"
        onClick={onCreateClick}
        className="w-12 h-12 bg-slate-950 hover:bg-slate-900 text-teal-400 rounded-full flex items-center justify-center -mt-6 shadow-xl border-4 border-white transition active:scale-95 cursor-pointer"
        aria-label="Track manually"
      >
        <Plus size={24} className="font-black text-teal-400" />
      </button>

      {/* Verify Rider Button */}
      <button
        type="button"
        onClick={onVerifyRiderClick}
        className="flex flex-col items-center gap-0.5 text-slate-600 hover:text-teal-600 font-bold text-[10px] uppercase tracking-wider transition cursor-pointer"
      >
        <QrCode size={20} />
        <span>Verify Rider</span>
      </button>

      <button
        type="button"
        onClick={handleLogout}
        className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-rose-600 font-bold text-[10px] uppercase tracking-wider transition cursor-pointer"
      >
        <LogOut size={20} />
        <span>Exit</span>
      </button>
    </nav>
  );
}