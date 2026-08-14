import { env } from "cloudflare:workers";

export type TrackingSecret = {
  accessToken: string;
  testEventCode?: string;
  apiVersion?: string;
};

export type GoogleTrackingSecret = {
  apiSecret: string;
};

function namespace() {
  return (env as unknown as { IZZAT_STORE?: KVNamespace }).IZZAT_STORE;
}

export async function readTrackingSecret(platform: "meta" | "tiktok", pixelId: string) {
  const kv = namespace();
  if (!kv || !pixelId) return null;
  const value = await kv.get<TrackingSecret>(`izzat:tracking:${platform}:${pixelId}`, "json");
  if (!value?.accessToken || typeof value.accessToken !== "string") return null;
  return value;
}

export async function readGoogleTrackingSecret(measurementId: string) {
  const kv = namespace();
  if (!kv || !measurementId) return null;
  const value = await kv.get<GoogleTrackingSecret>(`izzat:tracking:google:${measurementId}`, "json");
  if (!value?.apiSecret || typeof value.apiSecret !== "string") return null;
  return value;
}

export async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function normalizedEmail(value?: string) {
  return value?.trim().toLowerCase() || "";
}

export function normalizedPhone(value?: string) {
  const digits = value?.replace(/\D/g, "") || "";
  if (!digits) return "";
  return digits.startsWith("55") ? digits : `55${digits}`;
}

export function normalizedTikTokPhone(value?: string) {
  const digits = value?.replace(/\D/g, "") || "";
  if (!digits) return "";
  return `+${digits.startsWith("55") ? digits : `55${digits}`}`;
}

export function cookiesFrom(request: Request) {
  const entries = (request.headers.get("cookie") || "").split(";").map((part) => part.trim()).filter(Boolean).map((part) => {
    const separator = part.indexOf("=");
    if (separator < 0) return [part, ""];
    const rawValue = part.slice(separator + 1);
    try {
      return [part.slice(0, separator), decodeURIComponent(rawValue)];
    } catch {
      return [part.slice(0, separator), rawValue];
    }
  });
  return Object.fromEntries(entries) as Record<string, string>;
}
