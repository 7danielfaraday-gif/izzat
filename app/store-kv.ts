import { env } from "cloudflare:workers";

export type StoreDocument = {
  version: 1;
  products: unknown[];
  reviews: unknown[];
  settings: {
    announcement: string;
    heroTitle: string;
  };
  updatedAt: string;
};

const STORE_KEY = "izzat:store:v1";
const MAX_VALUE_SIZE = 24 * 1024 * 1024;

function namespace() {
  return (env as unknown as { IZZAT_STORE?: KVNamespace }).IZZAT_STORE;
}

export async function readStore(): Promise<StoreDocument | null> {
  const kv = namespace();
  if (!kv) return null;
  return kv.get<StoreDocument>(STORE_KEY, "json");
}

export async function writeStore(input: Omit<StoreDocument, "version" | "updatedAt">) {
  const kv = namespace();
  if (!kv) return { saved: false, local: true } as const;

  const document: StoreDocument = {
    version: 1,
    products: input.products,
    reviews: input.reviews,
    settings: input.settings,
    updatedAt: new Date().toISOString(),
  };
  const serialized = JSON.stringify(document);
  if (new TextEncoder().encode(serialized).byteLength > MAX_VALUE_SIZE) {
    throw new RangeError("STORE_TOO_LARGE");
  }

  await kv.put(STORE_KEY, serialized, {
    metadata: { version: document.version, updatedAt: document.updatedAt },
  });
  return { saved: true, updatedAt: document.updatedAt } as const;
}

export function validateStorePayload(value: unknown): Omit<StoreDocument, "version" | "updatedAt"> | null {
  if (!value || typeof value !== "object") return null;
  const payload = value as Partial<StoreDocument>;
  if (!Array.isArray(payload.products) || !Array.isArray(payload.reviews)) return null;
  if (!payload.settings || typeof payload.settings !== "object") return null;
  if (typeof payload.settings.announcement !== "string" || typeof payload.settings.heroTitle !== "string") return null;
  if (payload.products.some((product) => !product || typeof product !== "object" || typeof (product as { id?: unknown }).id !== "number")) return null;
  return {
    products: payload.products,
    reviews: payload.reviews,
    settings: {
      announcement: payload.settings.announcement.slice(0, 180),
      heroTitle: payload.settings.heroTitle.slice(0, 120),
    },
  };
}
