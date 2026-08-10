"use client";

import React, { useState } from "react";
import { MapPin, Phone, Mail, User } from "lucide-react";

export interface ReceiverProfile {
  name: string;
  phone: string;
  email: string;
  address: string;
}

interface EditReceiverProfileModalProps {
  readonly currentProfile: ReceiverProfile;
  readonly onSave: (updated: ReceiverProfile) => void;
  readonly onClose: () => void;
}

export default function EditReceiverProfileModal({
  currentProfile,
  onSave,
  onClose,
}: EditReceiverProfileModalProps) {
  const [formData, setFormData] = useState<ReceiverProfile>(currentProfile);

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl border animate-in zoom-in-95">
        <div className="flex justify-between items-center border-b pb-3">
          <h3 className="font-black text-slate-900 text-lg">Edit Delivery Profile</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold text-xl cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="receiver-name-input" className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
              Full Name
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                id="receiver-name-input"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="receiver-phone-input" className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
              Phone Number
            </label>
            <div className="relative">
              <Phone size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                id="receiver-phone-input"
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="receiver-email-input" className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
              Notification Email
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                id="receiver-email-input"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="receiver-address-input" className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
              Primary Delivery Address
            </label>
            <div className="relative">
              <MapPin size={16} className="absolute left-3 top-3 text-slate-400" />
              <textarea
                id="receiver-address-input"
                required
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none resize-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-slate-900 hover:bg-black text-white font-bold py-3 rounded-xl text-sm transition cursor-pointer"
          >
            Save Profile Changes
          </button>
        </form>
      </div>
    </div>
  );
}