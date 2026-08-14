import { env } from "cloudflare:workers";

const COOKIE_NAME = "izzat_admin_session";
const SESSION_DURATION_SECONDS = 12 * 60 * 60;
const MAX_LOGIN_ATTEMPTS = 8;

type AdminEnv = {
  IZZAT_STORE?: KVNamespace;
  IZZAT_ADMIN_PASSWORD?: string;
  IZZAT_ADMIN_SESSION_SECRET?: string;
};

function adminEnv() {
  return env as unknown as AdminEnv;
}

function bytesToHex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function hmac(value: string, secret: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return bytesToHex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)));
}

function safeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}

export function adminAuthConfigured() {
  const runtime = adminEnv();
  return Boolean(runtime.IZZAT_ADMIN_PASSWORD && runtime.IZZAT_ADMIN_SESSION_SECRET && runtime.IZZAT_ADMIN_SESSION_SECRET.length >= 32);
}

export async function verifyAdminPassword(password: string) {
  const configuredPassword = adminEnv().IZZAT_ADMIN_PASSWORD;
  if (!configuredPassword) return false;
  const [received, expected] = await Promise.all([hmac(password, configuredPassword), hmac(configuredPassword, configuredPassword)]);
  return safeEqual(received, expected);
}

export async function createAdminSession() {
  const secret = adminEnv().IZZAT_ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("ADMIN_AUTH_NOT_CONFIGURED");
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS;
  const nonce = crypto.randomUUID();
  const payload = `${expiresAt}.${nonce}`;
  return `${payload}.${await hmac(payload, secret)}`;
}

export async function verifyAdminSessionToken(token?: string | null) {
  const secret = adminEnv().IZZAT_ADMIN_SESSION_SECRET;
  if (!secret || !token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [expiresAt, nonce, signature] = parts;
  if (!/^\d+$/.test(expiresAt) || Number(expiresAt) <= Math.floor(Date.now() / 1000) || !nonce || !signature) return false;
  const expected = await hmac(`${expiresAt}.${nonce}`, secret);
  return safeEqual(signature, expected);
}

export function cookieValue(cookieHeader: string | null, name = COOKIE_NAME) {
  const cookie = (cookieHeader || "").split(";").map((item) => item.trim()).find((item) => item.startsWith(`${name}=`));
  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : "";
}

export async function verifyAdminRequest(request: Request) {
  return verifyAdminSessionToken(cookieValue(request.headers.get("cookie")));
}

export function adminSessionCookie(token: string, secure = true) {
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_DURATION_SECONDS}${secure ? "; Secure" : ""}`;
}

export function clearAdminSessionCookie(secure = true) {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure ? "; Secure" : ""}`;
}

function attemptKey(request: Request) {
  const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  return `izzat:admin:login-attempts:${ip.replace(/[^a-z0-9:._-]/gi, "").slice(0, 100)}`;
}

export async function loginAttemptAllowed(request: Request) {
  const kv = adminEnv().IZZAT_STORE;
  if (!kv) return true;
  const attempts = Number(await kv.get(attemptKey(request)) || "0");
  return attempts < MAX_LOGIN_ATTEMPTS;
}

export async function registerFailedLogin(request: Request) {
  const kv = adminEnv().IZZAT_STORE;
  if (!kv) return;
  const key = attemptKey(request);
  const attempts = Number(await kv.get(key) || "0") + 1;
  await kv.put(key, String(attempts), { expirationTtl: 15 * 60 });
}

export async function clearFailedLogins(request: Request) {
  const kv = adminEnv().IZZAT_STORE;
  if (kv) await kv.delete(attemptKey(request));
}
