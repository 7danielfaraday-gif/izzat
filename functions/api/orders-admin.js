// Cloudflare Pages Function: GET /api/orders-admin
// Protected endpoint to list recent orders from KV.
// Auth: HTTP Basic (set secrets PIX_ADMIN_USER and PIX_ADMIN_PASS)
// Storage: KV (binding name: PIX_STORE)

const PREFIX = 'order_v1:';
const DEFAULT_LIMIT = 50;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store, max-age=0',
    },
  });
}

function unauthorized() {
  return new Response('Unauthorized', {
    status: 401,
    headers: {
      'cache-control': 'no-store, max-age=0',
      'www-authenticate': 'Basic realm="PIX Admin", charset="UTF-8"',
    },
  });
}

function checkBasicAuth(request, env) {
  const user = env.PIX_ADMIN_USER;
  const pass = env.PIX_ADMIN_PASS;
  if (!user || !pass) return false;

  const auth = request.headers.get('authorization') || '';
  const m = auth.match(/^Basic\s+(.+)$/i);
  if (!m) return false;

  let decoded = '';
  try {
    decoded = atob(m[1]);
  } catch {
    return false;
  }

  const i = decoded.indexOf(':');
  if (i < 0) return false;

  const gotUser = decoded.slice(0, i);
  const gotPass = decoded.slice(i + 1);
  return gotUser === user && gotPass === pass;
}

export async function onRequestGet(context) {
  const { request, env } = context;

  if (!checkBasicAuth(request, env)) return unauthorized();
  if (!env.PIX_STORE) return json({ ok: false, error: 'PIX_STORE_KV_NOT_BOUND' }, 500);

  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || DEFAULT_LIMIT, 10) || DEFAULT_LIMIT, 200);

  let cursor = url.searchParams.get('cursor') || undefined;

  const listed = await env.PIX_STORE.list({ prefix: PREFIX, limit, cursor });
  const keys = (listed.keys || []).map(k => k.name);

  keys.sort().reverse();

  const orders = [];
  for (const k of keys) {
    const data = await env.PIX_STORE.get(k, { type: 'json' });
    if (data) orders.push({ key: k, ...data });
  }

  return json({
    ok: true,
    count: orders.length,
    cursor: listed.cursor || null,
    has_more: listed.list_complete === false,
    orders,
  });
}
