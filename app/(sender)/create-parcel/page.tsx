"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useCreateParcelHandler } from "../../../hooks/useCreateParcelHandler";
import { 
  Package, 
  Mail, 
  Phone, 
  MapPin, 
  Coins, 
  UploadCloud, 
  FileCheck,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";

export default function CreateParcelPage() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const { handleCreateParcel, isPending } = useCreateParcelHandler();

  const [formData, setFormData] = useState({
    receiverEmail: "",
    receiverPhone: "",
    contentsName: "",
    destinationAddress: "",
    courierFeeEth: "0.001",
  });
  const [file, setFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ trackingNumber: string; txHash: string } | null>(null);

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

    if (!isConnected) {
      setErrorMsg("Please connect your Web3 wallet first to sign the escrow transaction.");
      return;
    }

    try {
      const result = await handleCreateParcel(formData, file);
      if (result.success) {
        setSuccessData({
          trackingNumber: result.trackingNumber,
          txHash: result.txHash,
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create parcel";
      setErrorMsg(message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        
        {/* Navigation & Header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <ConnectButton showBalance={false} chainStatus="icon" />
        </div>

        {/* Card Container */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm dark:shadow-xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Package className="w-6 h-6 text-teal-600 dark:text-teal-500" />
              Create Delivery Escrow
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Lock payment in the smart contract. Funds are automatically released to the courier upon PIN verification.
            </p>
          </div>

          {/* Success Banner */}
          {successData && (
            <div className="mb-6 p-4 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-500/40 text-teal-800 dark:text-teal-200 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-teal-900 dark:text-teal-300">Escrow Created Successfully!</p>
                <p className="mt-1">Tracking Number: <span className="font-mono font-bold text-slate-900 dark:text-white">{successData.trackingNumber}</span></p>
                <p className="text-xs text-teal-700 dark:text-teal-400/80 break-all mt-0.5">TX: {successData.txHash}</p>
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
                <p className="font-semibold text-rose-900 dark:text-rose-300">Transaction Reverted</p>
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

            {/* Courier Fee (ETH) */}
            <div>
              <label htmlFor="courierFeeEth" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                Courier Escrow Fee (ETH)
              </label>
              <div className="relative">
                <Coins className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="courierFeeEth"
                  name="courierFeeEth"
                  type="number"
                  step="0.0001"
                  min="0.0001"
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
              disabled={isPending}
              className="w-full mt-2 py-3 px-4 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 disabled:bg-slate-200 disabled:text-slate-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-500 text-white font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Escrow & Deploying On-Chain...</span>
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