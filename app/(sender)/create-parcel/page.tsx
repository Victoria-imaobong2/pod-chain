"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Upload,
  Loader2,
  Wallet,
} from "lucide-react";

import {
  useAccount,
  useConnect,
  useDisconnect,
} from "wagmi";

import { useCreateParcelHandler } from "../../../hooks/useCreateParcelHandler";

export default function CreateParcelPage() {
  const router = useRouter();
  const {
    handleCreateParcel,
    isPending,
  } = useCreateParcelHandler();

  const [isProcessing, setIsProcessing] = useState(false);

  const {
    connectors,
    connect,
  } = useConnect();

  const {
    isConnected,
    address,
  } = useAccount();

  const {
    disconnect,
  } = useDisconnect();

  const [formData, setFormData] = useState({
    receiverEmail: "",
    receiverPhone: "",
    courierFeeEth: "0.01",
    ipfsHash: "",
    contentsName: "",
    destinationAddress: "",
  });

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [previewUrl, setPreviewUrl] =
    useState<string | null>(null);

  // Find MetaMask/browser wallet
  const metaMaskConnector = connectors.find(
    (connector) =>
      connector.type === "injected"
  );

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (
      e.target.files &&
      e.target.files[0]
    ) {
      const file = e.target.files[0];

      setSelectedFile(file);

      setPreviewUrl(
        URL.createObjectURL(file)
      );
    }
  }; 
  const onSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    // Prevent multiple clicks
    if (isProcessing || isPending) {
      return;
    }

    // Make sure wallet is connected
    if (!isConnected) {
      alert("Please connect your wallet first.");
      return;
    }

    setIsProcessing(true);

    try {
      const result =
        await handleCreateParcel(
          formData,
          selectedFile
        );

      if (result?.success) {
        alert(
          `Parcel Created Successfully!\n\nTransaction Hash: ${result.txHash}`
        );

        // Redirect back to sender home dashboard
        router.push("/dashboard");

        // Reset form
        type ParcelFormData = {
          receiverEmail: string;
          receiverPhone: string;
          courierFeeEth: string;
          ipfsHash: string;
          contentsName: string;
          destinationAddress: string;
};

        setSelectedFile(null);
        setPreviewUrl(null);
      }
    } catch (err) {
      console.error(err);

      const message =
        err instanceof Error
          ? err.message
          : "Failed to create parcel. Please try again.";

      alert(message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 flex flex-col items-center justify-center space-y-4">

      {/* WALLET STATUS */}
      <div className="w-full max-w-lg p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">

        <div className="flex items-center gap-2">

          <Wallet className="w-5 h-5 text-teal-600" />

          {isConnected ? (
            <span className="text-xs font-mono font-bold text-slate-800">
              {address?.slice(0, 6)}
              ...
              {address?.slice(-4)}
            </span>
          ) : (
            <span className="text-xs font-medium text-slate-500">
              Wallet Disconnected
            </span>
          )}

        </div>

        {isConnected ? (
          <button
            type="button"
            onClick={() => disconnect()}
            className="text-xs text-red-500 hover:text-red-600 font-bold px-3 py-1.5 rounded-lg border border-red-100 hover:bg-red-50 transition"
          >
            Disconnect
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              if (metaMaskConnector) {
                connect({
                  connector: metaMaskConnector,
                });
              } else {
                alert(
                  "MetaMask was not detected. Please enable the MetaMask extension for localhost."
                );
              }
            }}
            className="text-xs bg-pink-600 hover:bg-pink-700 text-white font-bold px-4 py-2 rounded-xl transition shadow-sm"
          >
            Connect Wallet
          </button>
        )}

      </div>

      {/* MAIN FORM */}
      <form
        onSubmit={onSubmit}
        className="w-full max-w-lg p-6 md:p-8 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-5"
      >

        {/* HEADER */}
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Create Delivery Escrow
          </h2>

          <p className="text-xs text-slate-500 font-medium mt-1">
            Lock funds in smart contract and pin parcel proof to IPFS.
          </p>
        </div>

        {/* RECEIVER EMAIL */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
            Receiver Email Address
          </label>

          <input
            type="email"
            required
            value={formData.receiverEmail}
            onChange={(e) =>
              setFormData({
                ...formData,
                receiverEmail: e.target.value,
              })
            }
            placeholder="receiver@example.com"
            className="w-full p-3 border border-slate-300 rounded-xl outline-none text-slate-900 bg-slate-50 focus:bg-white focus:border-teal-500 transition-all text-sm"
          />
        </div>

        {/* RECEIVER PHONE */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
            Receiver Phone Number
          </label>

          <input
            type="tel"
            required
            value={formData.receiverPhone}
            onChange={(e) =>
              setFormData({
                ...formData,
                receiverPhone: e.target.value,
              })
            }
            placeholder="+234..."
            className="w-full p-3 border border-slate-300 rounded-xl outline-none text-slate-900 bg-slate-50 focus:bg-white focus:border-teal-500 transition-all text-sm"
          />
        </div>

        {/* RECEIVER DESTINATION ADDRESS */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
            Receiver Destination Address
          </label>

          <input
            type="text"
            required
            value={formData.destinationAddress}
            onChange={(e) =>
              setFormData({
                ...formData,
                destinationAddress: e.target.value,
              })
            }
            placeholder="Street Address, City, State, ZIP"
            className="w-full p-3 border border-slate-300 rounded-xl outline-none text-slate-900 bg-slate-50 focus:bg-white focus:border-teal-500 transition-all text-sm"
          />
        </div>

        {/* PACKAGE CONTENTS */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
            Package Contents
          </label>

          <input
            type="text"
            required
            value={formData.contentsName}
            onChange={(e) =>
              setFormData({
                ...formData,
                contentsName: e.target.value,
              })
            }
            placeholder="e.g. Groceries"
            className="w-full p-3 border border-slate-300 rounded-xl outline-none text-slate-900 bg-slate-50 focus:bg-white focus:border-teal-500 transition-all text-sm"
          />
        </div>

       

        {/* COURIER FEE */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
            Courier Delivery Fee (ETH)
          </label>

          <input
            type="text"
            required
            value={formData.courierFeeEth}
            onChange={(e) =>
              setFormData({
                ...formData,
                courierFeeEth: e.target.value,
              })
            }
            placeholder="0.01"
            className="w-full p-3 border border-slate-300 rounded-xl outline-none text-slate-900 bg-slate-50 focus:bg-white focus:border-teal-500 transition-all text-sm"
          />
        </div>

        {/* PHOTO */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
            Package Proof Photo
          </label>

          <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center bg-slate-50 hover:bg-slate-100 transition relative cursor-pointer">

            <input
              type="file"
              accept="image/*"
              required
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />

            {previewUrl ? (
              <div className="flex items-center gap-4 text-left">

                <img
                  src={previewUrl}
                  alt="Package Preview"
                  className="w-16 h-16 object-cover rounded-lg border border-slate-300"
                />

                <div>

                  <p className="text-xs font-bold text-slate-800 truncate max-w-[200px]">
                    {selectedFile?.name}
                  </p>

                  <p className="text-[10px] text-teal-600 font-semibold mt-0.5">
                    Photo selected
                  </p>

                </div>

              </div>
            ) : (
              <div className="flex flex-col items-center py-3 text-slate-400">

                <Upload
                  size={24}
                  className="mb-1 text-teal-600"
                />

                <span className="text-xs font-bold text-slate-700">
                  Upload Package Photo
                </span>

                <span className="text-[10px] text-slate-400 mt-0.5">
                  PNG, JPG, or WEBP up to 10MB
                </span>

              </div>
            )}

          </div>
        </div>

        {/* SUBMIT */}
        <button
          type="submit"
          disabled={
            isProcessing ||
            isPending ||
            !isConnected
          }
          className="w-full bg-slate-950 hover:bg-slate-900 text-white font-bold py-3.5 rounded-xl text-sm shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >

          {isProcessing || isPending ? (
            <>
              <Loader2
                size={18}
                className="animate-spin text-teal-400"
              />

              <span>
                Processing and Deploying...
              </span>
            </>
          ) : (
            "Create & Deploy Delivery Escrow"
          )}

        </button>

      </form>

    </div>
  );
}