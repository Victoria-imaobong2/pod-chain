import type { StatusType } from "@/components/shared/StatusBadge";

/**
 * Shared client-side store for the sender's "Recent Shipments" ledger.
 *
 * The dashboard reads this list on mount and the create-parcel flow appends
 * to it after a successful escrow, so a freshly created parcel shows up in the
 * transaction table. Persistence is localStorage (per-origin, client-only).
 */

export interface DeliveryItem {
  id: string;
  item: string;
  address: string;
  timestamp: string;
  status: StatusType;
  hash: string;
  receiver: string;
}

export const RECENT_DELIVERIES_KEY = "pod_recent_deliveries";

/** Demo rows shown before the user has created any real parcels. */
export const INITIAL_DELIVERIES: DeliveryItem[] = [
  {
    id: "POD-001",
    item: "Groceries",
    address: "123 Royce Street, Cityville",
    timestamp: "2026-06-01 14:30",
    status: "Delivered",
    hash: "0x7a83...2c91",
    receiver: "0x111C...YU",
  },
  {
    id: "POD-002",
    item: "Groceries",
    address: "123 Item Street, Owerri",
    timestamp: "2026-06-01 14:30",
    status: "Delivered",
    hash: "0x4b12...ef84",
    receiver: "0x111C...YD",
  },
  {
    id: "POD-003",
    item: "Electronics",
    address: "789 Oak Ave, Villagetown",
    timestamp: "2026-06-02 10:15",
    status: "InTransit",
    hash: "0x9dca...33a1",
    receiver: "0x222D...AB",
  },
  {
    id: "POD-004",
    item: "Gadgets",
    address: "456 Elm St, Townsville",
    timestamp: "2026-06-03 09:00",
    status: "Created",
    hash: "Pending Escrow",
    receiver: "0x333E...CD",
  },
];

/** Read the stored ledger, falling back to the demo rows on first run. */
export function getRecentDeliveries(): DeliveryItem[] {
  if (typeof window === "undefined") return INITIAL_DELIVERIES;
  try {
    const saved = localStorage.getItem(RECENT_DELIVERIES_KEY);
    if (saved) return JSON.parse(saved) as DeliveryItem[];
  } catch (e) {
    console.error("Recent deliveries load error", e);
  }
  return INITIAL_DELIVERIES;
}

/** Persist the full ledger list. */
export function saveRecentDeliveries(deliveries: DeliveryItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(RECENT_DELIVERIES_KEY, JSON.stringify(deliveries));
  } catch (e) {
    console.error("Recent deliveries save error", e);
  }
}

/** Prepend a newly created parcel to the ledger and persist it. */
export function addRecentDelivery(item: DeliveryItem): DeliveryItem[] {
  const updated = [item, ...getRecentDeliveries()];
  saveRecentDeliveries(updated);
  return updated;
}

/** Shorten a hash/address for compact display, e.g. 0x7a83...2c91. */
export function shortenHash(value: string): string {
  if (!value || value.length <= 12) return value;
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}
