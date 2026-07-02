"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Plus, QrCode, ShieldCheck, Truck, LogOut } from 'lucide-react';

interface BottomNavProps {
  onCreateClick?: () => void;
}

export default function BottomNav({ onCreateClick }: BottomNavProps) {
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);

  // Read the authenticated user context safely inside the browser window lifecycle
  useEffect(() => {
    const savedRole = localStorage.getItem('user_role');
    setRole(savedRole || 'receiver'); // Fallback default to receiver layout if empty
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 py-2 px-6 z-40 flex justify-around items-center max-w-7xl mx-auto shadow-xl rounded-t-2xl">
      
      {/* SECTION A: SENDER INTERFACE VIEWS */}
      {role === 'sender' && (
        <>
          <Link href="/dashboard" className={`flex flex-col items-center gap-0.5 text-[10px] font-black uppercase tracking-wider ${pathname === '/dashboard' ? 'text-teal-600' : 'text-slate-400'}`}>
            <Home size={20} />
            <span>Merchant Hub</span>
          </Link>

          <button 
            onClick={onCreateClick}
            className="w-12 h-12 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl flex items-center justify-center shadow-md shadow-teal-600/20 active:scale-95 transition-all -mt-5 border-4 border-slate-50"
          >
            <Plus size={24} className="font-black" />
          </button>

          <Link href="/verify" className={`flex flex-col items-center gap-0.5 text-[10px] font-black uppercase tracking-wider ${pathname === '/verify' ? 'text-teal-600' : 'text-slate-400'}`}>
            <ShieldCheck size={20} />
            <span>Ledger</span>
          </Link>
        </>
      )}

      {/* SECTION B: RECEIVER INTERFACE VIEWS */}
      {role === 'receiver' && (
        <>
          <Link href="/receiver-dashboard" className={`flex flex-col items-center gap-0.5 text-[10px] font-black uppercase tracking-wider ${pathname === '/receiver-dashboard' ? 'text-teal-600' : 'text-slate-400'}`}>
            <Home size={20} />
            <span>My Packages</span>
          </Link>

          <button 
            onClick={onCreateClick}
            className="w-12 h-12 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl flex items-center justify-center shadow-md shadow-teal-600/20 active:scale-95 transition-all -mt-5 border-4 border-slate-50"
          >
            <Plus size={24} className="font-black" />
          </button>

          <Link href="/scan" className={`flex flex-col items-center gap-0.5 text-[10px] font-black uppercase tracking-wider ${pathname === '/scan' ? 'text-teal-600' : 'text-slate-400'}`}>
            <QrCode size={20} />
            <span>Verify Rider</span>
          </Link>
        </>
      )}

      {/* SECTION C: COURIER (RIDER) INTERFACE VIEWS */}
      {role === 'courier' && (
        <>
          <Link href="/courier-dashboard" className={`flex flex-col items-center gap-0.5 text-[10px] font-black uppercase tracking-wider ${pathname === '/courier-dashboard' ? 'text-blue-600' : 'text-slate-400'}`}>
            <Truck size={20} />
            <span>Rider Jobs</span>
          </Link>

          <Link href="/scan" className={`flex flex-col items-center gap-0.5 text-[10px] font-black uppercase tracking-wider ${pathname === '/scan' ? 'text-blue-600' : 'text-slate-400'}`}>
            <QrCode size={24} className="bg-blue-600 text-white p-1 rounded-xl shadow-md -mt-4 border-2 border-white w-10 h-10" />
            <span>Scan Handoff</span>
          </Link>
        </>
      )}

      {/* UNIVERSAL LOGOUT UTILITY */}
      <button onClick={handleLogout} className="flex flex-col items-center gap-0.5 text-[10px] font-black uppercase tracking-wider text-rose-400 hover:text-rose-600 transition-colors">
        <LogOut size={20} />
        <span>Exit</span>
      </button>

    </div>
  );
}