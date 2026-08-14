import { env } from "cloudflare:workers";

type AccessPayload = {
  aud?: string | string[];
  email?: string;
  exp?: number;
  iss?: string;
  nbf?: number;
};

const decodePart = <T,>(value: string): T => {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes)) as T;
};

const decodeSignature = (value: string) => {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
};

export async function verifyCloudflareAccess(request: Request) {
  const runtime = env as unknown as { CF_ACCESS_TEAM_DOMAIN?: string; CF_ACCESS_AUD?: string };
  const teamDomain = runtime.CF_ACCESS_TEAM_DOMAIN?.replace(/\/$/, "");
  const expectedAudience = runtime.CF_ACCESS_AUD;
  const token = request.headers.get("cf-access-jwt-assertion");
  if (!teamDomain || !expectedAudience || !token) return false;

  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const header = decodePart<{ alg?: string; kid?: string }>(parts[0]);
    const payload = decodePart<AccessPayload>(parts[1]);
    if (header.alg !== "RS256" || !header.kid || !payload.exp) return false;

    const now = Math.floor(Date.now() / 1000);
    const audiences = Array.isArray(payload.aud) ? payload.aud : payload.aud ? [payload.aud] : [];
    if (payload.exp <= now || (payload.nbf && payload.nbf > now) || !audiences.includes(expectedAudience)) return false;
    if (payload.iss?.replace(/\/$/, "") !== teamDomain) return false;

    const certificates = await fetch(`${teamDomain}/cdn-cgi/access/certs`, { cf: { cacheTtl: 3600, cacheEverything: true } } as RequestInit & { cf: Record<string, unknown> });
    if (!certificates.ok) return false;
    const keys = await certificates.json() as { keys?: Array<JsonWebKey & { kid?: string }> };
    const jwk = keys.keys?.find((key) => key.kid === header.kid);
    if (!jwk) return false;

    const publicKey = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
    return crypto.subtle.verify("RSASSA-PKCS1-v1_5", publicKey, decodeSignature(parts[2]), new TextEncoder().encode(`${parts[0]}.${parts[1]}`));
  } catch {
    return false;
  }
}
