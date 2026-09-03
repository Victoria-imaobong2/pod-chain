"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Plus, QrCode, ShieldCheck, Truck, LogOut } from "lucide-react";

interface BottomNavProps {
  onCreateClick?: () => void;
  onVerifyClick?: () => void;
}

type NormalizedRole = "sender" | "courier" | "receiver";

function resolveCurrentRole(): NormalizedRole {
  if (typeof window === "undefined") return "receiver";

  try {
    const rawUser = localStorage.getItem("user");
    if (rawUser) {
      const parsed = JSON.parse(rawUser);
      const r = String(parsed?.role || "").toLowerCase();
      if (r === "sme" || r === "sender") return "sender";
      if (r === "courier") return "courier";
      if (r === "receiver") return "receiver";
    }

    const token = localStorage.getItem("token");
    if (token && token.includes(".")) {
      const claims = JSON.parse(atob(token.split(".")[1]));
      const r = String(claims?.role || "").toLowerCase();
      if (r === "sme" || r === "sender") return "sender";
      if (r === "courier") return "courier";
      if (r === "receiver") return "receiver";
    }
  } catch (err) {
    console.warn("Error decoding user role in BottomNav:", err);
  }

  return "receiver";
}

export default function BottomNav({ onCreateClick, onVerifyClick }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const role: NormalizedRole = useMemo(() => {
  if (pathname?.startsWith("/dashboard")) return "sender";
  if (pathname?.startsWith("/courier")) return "courier";
  if (pathname?.startsWith("/receiver")) return "receiver";
  return resolveCurrentRole();
}, [pathname]);

  const handleLogout = () => {
    localStorage.clear();
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/login");
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 py-2.5 px-6 z-40 flex justify-around items-center max-w-7xl mx-auto shadow-xl rounded-t-2xl">
      
      {/* SECTION A: SENDER (SME) VIEWS */}
      {role === "sender" && (
        <>
          <Link
            href="/dashboard"
            className={`flex flex-col items-center gap-1 text-[10px] font-black uppercase tracking-wider transition-colors ${
              pathname === "/dashboard" ? "text-teal-600" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <Home size={20} />
            <span>Merchant Hub</span>
          </Link>

          {onCreateClick && (
            <button
              type="button"
              onClick={onCreateClick}
              className="w-12 h-12 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl flex items-center justify-center shadow-md shadow-teal-600/30 active:scale-95 transition-all -mt-5 border-4 border-slate-50 cursor-pointer"
            >
              <Plus size={24} className="stroke-[3]" />
            </button>
          )}

          <Link
            href="/dashboard"
            className={`flex flex-col items-center gap-1 text-[10px] font-black uppercase tracking-wider transition-colors ${
              pathname?.startsWith("/verify") ? "text-teal-600" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <ShieldCheck size={20} />
            <span>Ledger</span>
          </Link>
        </>
      )}

      {/* SECTION B: RECEIVER VIEWS */}
      {role === "receiver" && (
        <>
          <Link
            href="/receiver"
            className={`flex flex-col items-center gap-1 text-[10px] font-black uppercase tracking-wider transition-colors ${
              pathname === "/receiver" ? "text-teal-600" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <Home size={20} />
            <span>My Packages</span>
          </Link>

          {onCreateClick && (
            <button
              type="button"
              onClick={onCreateClick}
              className="w-12 h-12 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl flex items-center justify-center shadow-md shadow-teal-600/30 active:scale-95 transition-all -mt-5 border-4 border-slate-50 cursor-pointer"
            >
              <Plus size={24} className="stroke-[3]" />
            </button>
          )}

          {onVerifyClick ? (
            <button
              type="button"
              onClick={onVerifyClick}
              className="flex flex-col items-center gap-1 text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <QrCode size={20} />
              <span>Verify Rider</span>
            </button>
          ) : (
            <Link
              href="/scan"
              className={`flex flex-col items-center gap-1 text-[10px] font-black uppercase tracking-wider transition-colors ${
                pathname === "/scan" ? "text-teal-600" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <QrCode size={20} />
              <span>Verify Rider</span>
            </Link>
          )}
        </>
      )}

      {/* SECTION C: COURIER VIEWS */}
      {role === "courier" && (
        <>
          <Link
            href="/courier"
            className={`flex flex-col items-center gap-1 text-[10px] font-black uppercase tracking-wider transition-colors ${
              pathname === "/courier" ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <Truck size={20} />
            <span>Rider Jobs</span>
          </Link>

          <Link
            href="/scan"
            className="flex flex-col items-center gap-1 text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-slate-600 transition-colors"
          >
            <QrCode size={24} className="bg-blue-600 text-white p-1 rounded-xl shadow-md -mt-4 border-2 border-white w-10 h-10" />
            <span>Scan Handoff</span>
          </Link>
        </>
      )}

      {/* UNIVERSAL LOGOUT */}
      <button
        type="button"
        onClick={handleLogout}
        className="flex flex-col items-center gap-1 text-[10px] font-black uppercase tracking-wider text-rose-400 hover:text-rose-600 transition-colors cursor-pointer"
      >
        <LogOut size={20} />
        <span>Exit</span>
      </button>

    </nav>
  );
}