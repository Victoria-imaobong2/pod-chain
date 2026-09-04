"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useWallet } from "@solana/wallet-adapter-react";
import { useCreateParcelHandler } from "../../../hooks/useCreateParcelHandler";
import Link from "next/link";

type IconProps = React.SVGProps<SVGSVGElement>;

const Icon = ({ className, children, ...props }: IconProps) => (
  <svg
    {...props}
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const Package = (props: IconProps) => <Icon {...props}><path d="m16.5 9.4-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="M3.3 7 12 12l8.7-5M12 22V12"/></Icon>;
const Mail = (props: IconProps) => <Icon {...props}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></Icon>;
const Phone = (props: IconProps) => <Icon {...props}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 5.18 2 2 0 0 1 4.11 3h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.63a2 2 0 0 1-.45 2.11L8 10.73a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.85.29 1.73.5 2.63.62A2 2 0 0 1 22 16.92Z"/></Icon>;
const MapPin = (props: IconProps) => <Icon {...props}><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></Icon>;
const Coins = (props: IconProps) => <Icon {...props}><circle cx="8" cy="8" r="5"/><path d="M8 3v10M3 8h10M16 11a5 5 0 1 1-3 9M16 14v4M14 16h4"/></Icon>;
const UploadCloud = (props: IconProps) => <Icon {...props}><path d="M16 16l-4-4-4 4M12 12v9M20.4 17.5A5 5 0 0 0 18 8.5 7 7 0 0 0 4.7 11 4.5 4.5 0 0 0 5.5 20H7"/></Icon>;
const FileCheck = (props: IconProps) => <Icon {...props}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 16l2 2 4-4"/></Icon>;
const AlertCircle = (props: IconProps) => <Icon {...props}><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></Icon>;
const CheckCircle2 = (props: IconProps) => <Icon {...props}><circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/></Icon>;
const Loader2 = (props: IconProps) => <Icon {...props}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></Icon>;
const ArrowLeft = (props: IconProps) => <Icon {...props}><path d="m15 18-6-6 6-6M9 12h12"/></Icon>;

// Dynamically import WalletMultiButton to prevent Next.js SSR hydration mismatches
const WalletMultiButton = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

export default function CreateParcelPage() {
  const router = useRouter();
  const { connected } = useWallet();
  const { handleCreateParcel, isPending } = useCreateParcelHandler();

  const [formData, setFormData] = useState({
    receiverEmail: "",
    receiverPhone: "",
    contentsName: "",
    destinationAddress: "",
    courierFeeEth: "0.001", // Handled as SOL amount in the hook
  });
  const [file, setFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ trackingNumber: string; txHash: string } | null>(null);

  const [latencyStats, setLatencyStats] = useState<{
  totalTimeSec: string;
  timestamp: string;
} | null>(null);
  // Authentication guard
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem("token")) {
      router.replace("/login");
    }
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessData(null);
    setLatencyStats(null);

    // High-resolution start timer
    const t0 = performance.now();

    if (!connected) {
      setErrorMsg("Please connect your Phantom wallet first to sign the escrow transaction.");
      return;
    }

    try {
      const result = await handleCreateParcel(formData, file);
      const t1 = performance.now();
      const totalTimeSec = ((t1 - t0) / 1000).toFixed(2);
      if (result.success) {
        setSuccessData({
          trackingNumber: result.trackingNumber,
          txHash: result.txHash,
        });

        setLatencyStats({
          totalTimeSec,
          timestamp: new Date().toLocaleTimeString(),
        });

        console.table({
          Metric: "Parcel Creation End-to-End Latency",
          "Duration (s)": `${totalTimeSec}s`,
          "Tracking ID": result.trackingNumber,
          "Tx Signature": result.txHash,
        });

      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create parcel";
      setErrorMsg(message);
    }
  };

  

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center font-sans antialiased">
      <div className="w-full max-w-2xl">
        
        {/* Navigation & Header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <WalletMultiButton className="!bg-teal-600 hover:!bg-teal-700 !h-10 !px-4 !rounded-xl !text-sm !font-bold" />
        </div>

        {/* Card Container */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm dark:shadow-xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Package className="w-6 h-6 text-teal-600 dark:text-teal-500" />
              Create Delivery Escrow
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Lock payment in the Solana smart escrow. Funds are automatically released to the courier upon PIN verification.
            </p>
          </div>

          {/* Success Banner */}
          {successData && (
            <div className="mb-6 p-4 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-500/40 text-teal-800 dark:text-teal-200 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-teal-900 dark:text-teal-300">Escrow Created Successfully on Solana Devnet!</p>
                <p className="mt-1">Tracking Number: <span className="font-mono font-bold text-slate-900 dark:text-white">{successData.trackingNumber}</span></p>
                <p className="text-xs text-teal-700 dark:text-teal-400/80 break-all mt-0.5 font-mono">TX: {successData.txHash}</p>

                {/* Latency Empirical Benchmark Badge */}
                {latencyStats && (
                  <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-teal-100/70 dark:bg-teal-900/60 text-[11px] font-mono font-medium text-teal-900 dark:text-teal-200 border border-teal-300/60 dark:border-teal-700/50">
                    <span>⚡ Creation & Settlement Time:</span>
                    <span className="font-bold">{latencyStats.totalTimeSec}s</span>
                  </div>
                )}
                
                <div className="mt-3">
                  <Link
                    href="/dashboard"
                    className="inline-block px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-medium transition-colors shadow-sm"
                  >
                    View in Dashboard
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-500/40 text-rose-800 dark:text-rose-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-rose-900 dark:text-rose-300">Transaction Failed</p>
                <p className="text-xs text-rose-700 dark:text-rose-300/80 mt-1 leading-relaxed">{errorMsg}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Contents Name */}
            <div>
              <label htmlFor="contentsName" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                Package Contents
              </label>
              <div className="relative">
                <Package className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="contentsName"
                  name="contentsName"
                  type="text"
                  required
                  placeholder="e.g. Garri / Electronics / Important Documents"
                  value={formData.contentsName}
                  onChange={handleChange}
                  className="w-full bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-800 rounded-xl py-2.5 pl-11 pr-4 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Receiver Email & Phone Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="receiverEmail" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                  Receiver Email (For OTP)
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="receiverEmail"
                    name="receiverEmail"
                    type="email"
                    required
                    placeholder="receiver@email.com"
                    value={formData.receiverEmail}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-800 rounded-xl py-2.5 pl-11 pr-4 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="receiverPhone" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                  Receiver Phone
                </label>
                <div className="relative">
                  <Phone className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="receiverPhone"
                    name="receiverPhone"
                    type="text"
                    required
                    placeholder="07039102053"
                    value={formData.receiverPhone}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-800 rounded-xl py-2.5 pl-11 pr-4 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Destination Address */}
            <div>
              <label htmlFor="destinationAddress" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                Destination Address
              </label>
              <div className="relative">
                <MapPin className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
                <textarea
                  id="destinationAddress"
                  name="destinationAddress"
                  rows={2}
                  required
                  placeholder="Full delivery location or campus address"
                  value={formData.destinationAddress}
                  onChange={handleChange}
                  className="w-full bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-800 rounded-xl py-2.5 pl-11 pr-4 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all resize-none"
                />
              </div>
            </div>

            {/* Courier Fee (SOL) */}
            <div>
              <label htmlFor="courierFeeEth" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                Courier Escrow Fee (SOL)
              </label>
              <div className="relative">
                <Coins className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="courierFeeEth"
                  name="courierFeeEth"
                  type="number"
                  step="0.0005"
                  min="0.0005"
                  required
                  value={formData.courierFeeEth}
                  onChange={handleChange}
                  className="w-full bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-800 rounded-xl py-2.5 pl-11 pr-4 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all font-mono"
                />
              </div>
            </div>

            {/* File / IPFS Upload Box */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                Item Photo / Documentation (Optional IPFS)
              </label>
              <label
                htmlFor="file-upload"
                className="border-2 border-dashed border-slate-300 hover:border-slate-400 dark:border-slate-800 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-950/40 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors"
              >
                {file ? (
                  <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 text-sm">
                    <FileCheck className="w-5 h-5" />
                    <span className="font-medium text-slate-800 dark:text-slate-200">{file.name}</span>
                    <span className="text-xs text-slate-500">({(file.size / 1024).toFixed(1)} KB)</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1.5 text-center">
                    <UploadCloud className="w-6 h-6 text-slate-400" />
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Click to upload item snapshot or proof document</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-600">PNG, JPG, PDF up to 10MB</span>
                  </div>
                )}
                <input
                  id="file-upload"
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isPending || !connected}
              className="w-full mt-2 py-3 px-4 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 disabled:bg-slate-200 disabled:text-slate-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-500 text-white font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {
                !connected ?(
                  <span>Please connect your Phantom wallet to proceed</span>
                ):
              isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Escrow & Signing Transaction...</span>
                </>
              ) : (
                <span>Create & Deploy Delivery Escrow</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}