"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Package, Plus, QrCode, LogOut } from 'lucide-react';

interface ReceiverNavProps {
  onCreateClick: () => void;
}

export default function BottomNavReceiver({ onCreateClick }: ReceiverNavProps) {
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 py-2.5 px-6 z-40 flex justify-around items-center max-w-7xl mx-auto shadow-xl rounded-t-2xl">
      
      {/* 1. Hub Route target */}
      <Link href="/receiver-dashboard" className={`flex flex-col items-center gap-0.5 text-[10px] font-black uppercase tracking-widest transition-colors ${pathname === '/receiver-dashboard' ? 'text-teal-600' : 'text-slate-400 hover:text-slate-600'}`}>
        <Package size={20} />
        <span>My Packages</span>
      </Link>

      {/* 2. Specialized Track Action Trigger Key */}
      <button 
        onClick={onCreateClick}
        className="w-12 h-12 bg-slate-950 hover:bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-md shadow-slate-950/20 active:scale-95 transition-all -mt-6 border-4 border-slate-50"
        aria-label="Track manually"
      >
        <Plus size={24} className="font-black text-teal-400" />
      </button>

      {/* 3. Scanner interface shortcut */}
      <Link href="/scan" className={`flex flex-col items-center gap-0.5 text-[10px] font-black uppercase tracking-widest transition-colors ${pathname === '/scan' ? 'text-teal-600' : 'text-slate-400'}`}>
        <QrCode size={20} />
        <span>Verify Rider</span>
      </Link>

      {/* 4. Exit Utility anchor */}
      <button onClick={handleLogout} className="flex flex-col items-center gap-0.5 text-[10px] font-black uppercase tracking-widest text-rose-400 hover:text-rose-600 transition-colors">
        <LogOut size={20} />
        <span>Exit</span>
      </button>

    </div>
  );
}