"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";
import { ArrowLeft, Camera } from "lucide-react";

export default function ScanPage() {
  const router = useRouter();
  const [scanResult, setScanResult] = useState<string | null>(null);
  const isStartedRef = useRef(false);

  useEffect(() => {
    const scannerId = "qr-reader-container";
    const html5QrCode = new Html5Qrcode(scannerId);

    const startCamera = async () => {
      // Prevent duplicate instances if already started
      if (isStartedRef.current) return;
      try {
        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            setScanResult(decodedText);
          },
          () => {
            // Ignore ongoing frame noise
          }
        );
        isStartedRef.current = true;
      } catch (err) {
        console.error("Camera start error:", err);
      }
    };

    void startCamera();

    return () => {
      if (html5QrCode.isScanning) {
        html5QrCode
          .stop()
          .then(() => {
            html5QrCode.clear();
            isStartedRef.current = false;
          })
          .catch((err) => console.error("Error stopping scanner:", err));
      } else {
        html5QrCode.clear();
        isStartedRef.current = false;
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 flex flex-col items-center justify-between">
      <header className="w-full max-w-md flex items-center justify-between py-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-2 bg-slate-800 rounded-xl hover:bg-slate-700 transition cursor-pointer"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-black tracking-tight">Scan Delivery QR</h1>
        <div className="w-9" />
      </header>

      <div className="w-full max-w-md flex flex-col items-center">
        {/* Container strictly styled to avoid duplicate stacked views */}
        <div className="w-full max-w-[320px] h-[320px] rounded-2xl overflow-hidden border-2 border-teal-500 shadow-2xl bg-black relative flex items-center justify-center">
          <div id="qr-reader-container" className="w-full h-full [&_video]:w-full [&_video]:h-full [&_video]:object-cover" />
        </div>

        {scanResult && (
          <div className="mt-4 p-4 bg-teal-950/80 border border-teal-600 rounded-xl text-center w-full">
            <p className="text-xs text-teal-400 font-bold uppercase tracking-wider">
              Scanned Payload
            </p>
            <p className="font-mono text-sm mt-1 break-all">{scanResult}</p>
          </div>
        )}
      </div>

      <div className="w-full max-w-md pb-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
        <Camera size={16} className="text-teal-400" />
        <span>Align the QR code within the frame to verify dispatch</span>
      </div>
    </div>
  );
}