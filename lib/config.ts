/**
 * Single source of truth for the backend origin.
 *
 * The URL comes from NEXT_PUBLIC_API_URL (see .env.local) so the whole
 * frontend talks to one consistent host. Keeping this in one place avoids
 * the localhost-vs-127.0.0.1 split that made the JWT (stored in
 * localStorage, which is per-origin) look like it had "expired".
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
  export const CONTRACT_ADDRESS = "0x2279b7a0a67db372996a5fab50d91eaa73d2ebe6" as `0x${string}`;
