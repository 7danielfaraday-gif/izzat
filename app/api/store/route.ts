import { readStore } from "../../store-kv";

export async function GET() {
  try {
    const store = await readStore();
    return Response.json({ store }, {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=3600",
        "Vary": "Accept-Encoding",
      },
    });
  } catch {
    return Response.json({ error: "Não foi possível carregar a loja." }, { status: 503 });
  }
}
