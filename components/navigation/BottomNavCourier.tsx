"use client";

import React from 'react';
import Link from 'next/link';
import { Truck, MapPin, LogOut } from 'lucide-react';

export default function BottomNavCourier() {
  const handleLogout = () => {
    document.cookie = "role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 py-2.5 px-6 flex justify-around items-center z-40 shadow-lg">
      {/* Active Jobs Manifest Link */}
      <Link href="/courier" className="flex flex-col items-center gap-0.5 text-slate-600 hover:text-teal-600 font-bold text-[10px] uppercase tracking-wider">
        <Truck size={20} />
        <span>Rider Manifest</span>
      </Link>

      {/* Static Visual Spacer */}
      <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center -mt-6 border-4 border-white shadow-md text-slate-400">
        <MapPin size={18} />
      </div>

      {/* Exit Control */}
      <button
        type="button"
        onClick={handleLogout}
        className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-rose-600 font-bold text-[10px] uppercase tracking-wider transition cursor-pointer"
      >
        <LogOut size={20} />
        <span>Sign Out</span>
      </button>
    </div>
  );
}