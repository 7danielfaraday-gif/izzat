interface Fetcher {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

interface KVNamespace {
  get(key: string): Promise<string | null>;
  get<T>(key: string, type: "json"): Promise<T | null>;
  put(key: string, value: string | ArrayBuffer | ReadableStream, options?: { expiration?: number; expirationTtl?: number; metadata?: Record<string, unknown> }): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<{ keys: Array<{ name: string; expiration?: number; metadata?: unknown }>; list_complete: boolean; cursor?: string }>;
}

declare module "cloudflare:workers" {
  export const env: Record<string, any>;
}
