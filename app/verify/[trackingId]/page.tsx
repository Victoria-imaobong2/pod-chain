import React from 'react';

interface VerifyPageProps {
  params: Promise<{
    trackingId: string;
  }>;
}

export default async function VerifyTrackingPage({ params }: VerifyPageProps) {
  const { trackingId } = await params;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h1 className="text-xl font-bold tracking-tight text-white">Parcel Verification</h1>
        <p className="text-sm text-slate-400">
          Tracking ID: <span className="font-mono text-emerald-400 font-semibold">{trackingId}</span>
        </p>
        <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 text-xs text-slate-300">
          On-chain proof of delivery verification and parcel handover.
        </div>
      </div>
    </div>
  );
}