import { env } from "cloudflare:workers";

export type StoredOrder = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: "pix_pending" | "paid" | "cancelled";
  customer: {
    name: string;
    email: string;
    phone: string;
    cpf: string;
    cep: string;
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
  };
  product: {
    id: number;
    name: string;
    image: string;
    quantity: number;
    price: number;
    pix: number;
  };
};

const ORDER_PREFIX = "izzat:order:v1:";

function namespace() {
  return (env as unknown as { IZZAT_STORE?: KVNamespace }).IZZAT_STORE;
}

const clean = (value: unknown, limit: number) => String(value ?? "").trim().slice(0, limit);

export function validateOrderPayload(value: unknown): Omit<StoredOrder, "createdAt" | "updatedAt" | "status"> | null {
  if (!value || typeof value !== "object") return null;
  const payload = value as Record<string, unknown>;
  const customer = payload.customer as Record<string, unknown> | undefined;
  const product = payload.product as Record<string, unknown> | undefined;
  const id = clean(payload.id, 40);
  if (!/^IZ-\d{3,8}-\d{6,16}$/.test(id) || !customer || !product) return null;
  const normalized = {
    id,
    customer: {
      name: clean(customer.name, 120),
      email: clean(customer.email, 160).toLowerCase(),
      phone: clean(customer.phone, 24),
      cpf: clean(customer.cpf, 18),
      cep: clean(customer.cep, 10),
      street: clean(customer.street, 160),
      number: clean(customer.number, 30),
      complement: clean(customer.complement, 100),
      neighborhood: clean(customer.neighborhood, 100),
      city: clean(customer.city, 100),
      state: clean(customer.state, 2).toUpperCase(),
    },
    product: {
      id: Number(product.id),
      name: clean(product.name, 180),
      image: clean(product.image, 2000),
      quantity: Math.max(1, Math.min(20, Number(product.quantity) || 1)),
      price: Number(product.price),
      pix: Number(product.pix),
    },
  };
  if (normalized.customer.name.length < 3 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized.customer.email)) return null;
  if (normalized.customer.phone.replace(/\D/g, "").length < 10 || normalized.customer.cep.replace(/\D/g, "").length !== 8) return null;
  if (!normalized.product.id || !normalized.product.name || !Number.isFinite(normalized.product.pix) || normalized.product.pix <= 0) return null;
  return normalized;
}

export async function saveOrder(input: Omit<StoredOrder, "createdAt" | "updatedAt" | "status">) {
  const kv = namespace();
  const now = new Date().toISOString();
  const key = `${ORDER_PREFIX}${input.id}`;
  if (!kv) return { ...input, status: "pix_pending", createdAt: now, updatedAt: now } satisfies StoredOrder;
  const existing = await kv.get<StoredOrder>(key, "json");
  const order: StoredOrder = { ...input, status: existing?.status || "pix_pending", createdAt: existing?.createdAt || now, updatedAt: now };
  await kv.put(key, JSON.stringify(order));
  return order;
}

export async function listOrders() {
  const kv = namespace();
  if (!kv) return [] as StoredOrder[];
  const listed = await kv.list({ prefix: ORDER_PREFIX, limit: 1000 });
  const orders = await Promise.all(listed.keys.map((key) => kv.get<StoredOrder>(key.name, "json")));
  return orders.filter((order): order is StoredOrder => Boolean(order)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function updateOrderStatus(id: string, status: StoredOrder["status"]) {
  const kv = namespace();
  if (!kv) return null;
  const key = `${ORDER_PREFIX}${id}`;
  const order = await kv.get<StoredOrder>(key, "json");
  if (!order) return null;
  const updated = { ...order, status, updatedAt: new Date().toISOString() };
  await kv.put(key, JSON.stringify(updated));
  return updated;
}
