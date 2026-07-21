// app/(sender)/create-parcel/page.tsx
"use client";

import { useState } from "react";
import { useCreateParcelHandler } from "@/hooks/useCreateParcelHandler"; // Adjust path as needed

export default function CreateParcelPage() {
  const { handleCreateParcel, isSubmittingTx } = useCreateParcelHandler();
  
  const [formData, setFormData] = useState({
    receiverEmail: "",
    receiverPhone: "",
    courierFeeEth: "0.01",
    ipfsHash: "QmSampleIpfsHashFromPinata",
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await handleCreateParcel(formData);
      alert("Parcel Created Successfully! Transaction Hash: " + result.txHash);
    } catch (err) {
      alert("Failed to create parcel. Check console for details.");
    }
  };

  return (
    <form onSubmit={onSubmit} className="max-w-md p-6 bg-white rounded-xl shadow">
      {/* Form inputs go here */}
      <button 
        type="submit" 
        disabled={isSubmittingTx}
        className="w-full bg-blue-600 text-white py-2 rounded-lg"
      >
        {isSubmittingTx ? "Confirming on Blockchain..." : "Create Delivery Escrow"}
      </button>
    </form>
  );
}