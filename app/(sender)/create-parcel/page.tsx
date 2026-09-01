"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { useCreateParcelHandler } from "@/hooks/useCreateParcelHandler";

export default function CreateParcelPage() {
  const router = useRouter();
  const { address } = useAccount();
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
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Authentication guard
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem("token")) {
      router.replace("/login");
    }
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const result = await handleCreateParcel(formData, file);
      if (result.success) {
        setSuccessMsg(`Parcel created successfully! Tracking: ${result.trackingNumber}`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create parcel";
      setErrorMsg(message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Create New Delivery Escrow</h1>
          <span
            suppressHydrationWarning
            className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded"
          >
            {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Wallet Disconnected"}
          </span>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded border border-green-200">
            {successMsg}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="receiverEmail" className="block text-sm font-medium text-slate-700 mb-1">
              Receiver Email
            </label>
            <input
              id="receiverEmail"
              name="receiverEmail"
              type="email"
              required
              value={formData.receiverEmail}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="receiverPhone" className="block text-sm font-medium text-slate-700 mb-1">
              Receiver Phone
            </label>
            <input
              id="receiverPhone"
              name="receiverPhone"
              type="text"
              required
              value={formData.receiverPhone}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="contentsName" className="block text-sm font-medium text-slate-700 mb-1">
              Package Contents
            </label>
            <input
              id="contentsName"
              name="contentsName"
              type="text"
              required
              value={formData.contentsName}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="destinationAddress" className="block text-sm font-medium text-slate-700 mb-1">
              Destination Address
            </label>
            <input
              id="destinationAddress"
              name="destinationAddress"
              type="text"
              required
              value={formData.destinationAddress}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="courierFeeEth" className="block text-sm font-medium text-slate-700 mb-1">
              Courier Escrow Fee (ETH)
            </label>
            <input
              id="courierFeeEth"
              name="courierFeeEth"
              type="number"
              step="0.0001"
              required
              value={formData.courierFeeEth}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="file" className="block text-sm font-medium text-slate-700 mb-1">
              Upload Item Photo / Documents (Optional)
            </label>
            <input
              id="file"
              name="file"
              type="file"
              onChange={handleFileChange}
              className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-sm transition disabled:opacity-50"
          >
            {isPending ? "Creating Escrow & Deploying..." : "Create & Deploy Delivery Escrow"}
          </button>
        </form>
      </div>
    </div>
  );
}