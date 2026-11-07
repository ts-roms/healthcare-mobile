/**
 * Build-time settings (`EXPO_PUBLIC_*` are inlined into the app and readable in the binary — never a secret).
 * One build serves one organization, as one MyHealth web deployment does (`PORTAL_ORGANIZATION_CODE`).
 * Set them in `.env.local` (see `.env.example`). From a phone, the API address is the development machine's, not localhost.
 */
export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL ?? "").replace(/\/+$/, "");
export const ORGANIZATION_CODE = process.env.EXPO_PUBLIC_ORGANIZATION_CODE ?? "";
/** MyHealth on the web: online consultations open there (decision D8). Optional. */
export const PORTAL_BASE_URL = (process.env.EXPO_PUBLIC_PORTAL_BASE_URL ?? "").replace(/\/+$/, "");

export const configured = API_BASE_URL !== "" && ORGANIZATION_CODE !== "";
/**
 * The API's realtime socket (Socket.IO namespace `/realtime`), which tells an open conversation that the clinic replied.
 * Defaults to the API's own origin, as MyHealth on the web does (`REALTIME_URL` there).
 */
export const REALTIME_URL = (process.env.EXPO_PUBLIC_REALTIME_URL ?? "").replace(/\/+$/, "") || realtimeUrlFor(API_BASE_URL);

export function realtimeUrlFor(apiBaseUrl: string): string {
  const origin = /^(https?:\/\/[^/]+)/i.exec(apiBaseUrl)?.[1];
  return origin ? `${origin}/realtime` : "";
}
