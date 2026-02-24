function unauthorized() {
  return new Response("Unauthorized", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Izzat Admin"' },
  });
}

function checkBasicAuth(request, env) {
  const user = env.PIX_ADMIN_USER || "admin";
  const pass = env.PIX_ADMIN_PASS || "";
  if (!pass) return false;

  const h = request.headers.get("Authorization") || "";
  if (!h.startsWith("Basic ")) return false;

  try {
    const decoded = atob(h.slice(6));
    const idx = decoded.indexOf(":");
    if (idx < 0) return false;
    const u = decoded.slice(0, idx);
    const p = decoded.slice(idx + 1);
    return u === user && p === pass;
  } catch {
    return false;
  }
}

export async function onRequestGet({ request, env }) {
  if (!env.PIX_STORE) {
    return new Response(JSON.stringify({ ok: false, error: "kv_not_bound_PIX_STORE" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  if (!checkBasicAuth(request, env)) return unauthorized();

  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "200", 10), 500);

  // list keys with prefix order:
  const list = await env.PIX_STORE.list({ prefix: "order:", limit });

  const orders = [];
  for (const k of list.keys) {
    const v = await env.PIX_STORE.get(k.name);
    if (!v) continue;
    try { orders.push(JSON.parse(v)); } catch {}
  }

  orders.sort((a,b) => (b.created_at || "").localeCompare(a.created_at || ""));

  return new Response(JSON.stringify({ ok: true, count: orders.length, orders }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
