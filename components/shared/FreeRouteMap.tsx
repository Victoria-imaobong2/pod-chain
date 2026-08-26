"use client";

import React, { useEffect, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

interface FreeRouteMapProps {
  lat?: number;
  lng?: number;
  label?: string;
}

const subscribe = () => () => {};

export default function FreeRouteMap({
  lat = 5.4851,
  lng = 7.0353,
  label = "Delivery Destination",
}: FreeRouteMapProps) {
  const isClient = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );

  useEffect(() => {
    import("leaflet").then((L) => {
      const defaultIconProto = L.Icon.Default.prototype as {
        _getIconUrl?: () => string;
      };
      delete defaultIconProto._getIconUrl;

      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
    });
  }, []);

  if (!isClient) {
    return (
      <div className="h-52 bg-slate-100 flex items-center justify-center text-xs text-slate-500 rounded-2xl">
        Loading Map...
      </div>
    );
  }

  return (
    <div className="w-full h-52 overflow-hidden rounded-2xl border border-slate-200">
      <MapContainer
        center={[lat, lng]}
        zoom={14}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]}>
          <Popup>{label}</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}