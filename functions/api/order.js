export async function onRequestPost({ request, env }) {
  try {
    const data = await request.json();

    if (!env.PIX_STORE) {
      return new Response(JSON.stringify({ ok: false, error: "kv_not_bound_PIX_STORE" }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }

    const now = new Date();
    const id = "ord_" + now.getTime().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
    const record = {
      id,
      created_at: now.toISOString(),
      status: "PIX_PENDENTE",
      ...data,
    };

    await env.PIX_STORE.put("order:" + id, JSON.stringify(record));

    return new Response(JSON.stringify({ ok: true, id }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: "bad_request", detail: String(e) }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
}
