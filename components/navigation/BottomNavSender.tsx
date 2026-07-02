"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Plus, ShieldCheck, LogOut } from 'lucide-react';

interface SenderNavProps {
  onCreateClick: () => void;
}

export default function BottomNavSender({ onCreateClick }: SenderNavProps) {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 py-2.5 px-6 z-40 flex justify-around items-center max-w-7xl mx-auto shadow-xl rounded-t-2xl">
      
      <Link href="/dashboard" className={`flex flex-col items-center gap-0.5 text-[10px] font-black uppercase tracking-widest ${pathname === '/dashboard' ? 'text-teal-600' : 'text-slate-400'}`}>
        <Home size={20} />
        <span>Vendor Hub</span>
      </Link>

      <button type='button'
        onClick={onCreateClick}
        className="w-12 h-12 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl flex items-center justify-center shadow-md shadow-teal-600/20 active:scale-95 transition-all -mt-6 border-4 border-slate-50"
      >
        <Plus size={24} className="font-black" />
      </button>

      <Link href="/verify" className={`flex flex-col items-center gap-0.5 text-[10px] font-black uppercase tracking-widest ${pathname === '/verify' ? 'text-teal-600' : 'text-slate-400'}`}>
        <ShieldCheck size={20} />
        <span>Ledger</span>
      </Link>

      <button onClick={() => { localStorage.clear(); window.location.href = '/login'; }} className="flex flex-col items-center gap-0.5 text-[10px] font-black uppercase tracking-widest text-rose-400">
        <LogOut size={20} />
        <span>Exit</span>
      </button>

    </div>
  );
}