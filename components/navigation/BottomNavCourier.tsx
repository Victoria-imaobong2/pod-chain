"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Truck, MapPin, LogOut } from 'lucide-react';

export default function BottomNavCourier() {
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 py-3.5 px-6 z-40 flex justify-around items-center max-w-7xl mx-auto shadow-xl rounded-t-2xl">
      
      {/* Active Jobs Manifest View Link */}
      <Link href="/courier-dashboard" className={`flex flex-col items-center gap-0.5 text-[10px] font-black uppercase tracking-widest transition-colors ${pathname === '/courier-dashboard' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
        <Truck size={20} />
        <span>Rider Manifest</span>
      </Link>

      {/* Static visual layout filler matching center button ergonomics */}
      <div className="w-12 h-12 bg-slate-100 rounded-2xl -mt-6 border-4 border-slate-50 flex items-center justify-center text-slate-400">
        <MapPin size={18} />
      </div>

      {/* Universal Exit Session control */}
      <button onClick={handleLogout} className="flex flex-col items-center gap-0.5 text-[10px] font-black uppercase tracking-widest text-rose-400 hover:text-rose-600 transition-colors">
        <LogOut size={20} />
        <span>Sign Out</span>
      </button>

    </div>
  );
}