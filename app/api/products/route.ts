import { readStore } from "../../store-kv";

export async function GET() {
  try {
    const store = await readStore();
    return Response.json({ products: store?.products ?? [] }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json({ products: [] }, { status: 503 });
  }
}
