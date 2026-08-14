import { verifyAdminRequest } from "../../admin-auth";
import { listOrders, saveOrder, updateOrderStatus, validateOrderPayload, type StoredOrder } from "../../orders-kv";
import { readStore } from "../../store-kv";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!await verifyAdminRequest(request)) return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  return Response.json({ orders: await listOrders() }, { headers: { "cache-control": "no-store" } });
}

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ error: "INVALID_JSON" }, { status: 400 }); }
  const order = validateOrderPayload(body);
  if (!order) return Response.json({ error: "INVALID_ORDER" }, { status: 400 });
  const store = await readStore();
  const catalogProduct = store?.products.find((item) => (item as { id?: number }).id === order.product.id) as { id: number; name?: string; image?: string; price?: number; pix?: number } | undefined;
  const verifiedOrder = catalogProduct ? { ...order, product: { ...order.product, name: String(catalogProduct.name || order.product.name), image: String(catalogProduct.image || order.product.image), price: Number(catalogProduct.price) || order.product.price, pix: Number(catalogProduct.pix) || order.product.pix } } : order;
  const saved = await saveOrder(verifiedOrder);
  return Response.json({ order: { id: saved.id, createdAt: saved.createdAt } }, { status: 201 });
}

export async function PATCH(request: Request) {
  if (!await verifyAdminRequest(request)) return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  let body: { id?: string; status?: StoredOrder["status"] };
  try { body = await request.json(); } catch { return Response.json({ error: "INVALID_JSON" }, { status: 400 }); }
  if (!body.id || !body.status || !["pix_pending", "paid", "cancelled"].includes(body.status)) return Response.json({ error: "INVALID_STATUS" }, { status: 400 });
  const order = await updateOrderStatus(body.id, body.status);
  return order ? Response.json({ order }) : Response.json({ error: "NOT_FOUND" }, { status: 404 });
}
