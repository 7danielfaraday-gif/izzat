// Cloudflare Pages Function: POST /api/order
// Public endpoint to register checkout info as an "order" in KV.
// Storage: KV (binding name: PIX_STORE)  (re-uses your existing KV binding)
//
// Notes:
// - This DOES NOT confirm payment. It only stores the customer's info so you can fulfill manually.
// - Keep PII handling in mind. This stores what the frontend sends.

const PREFIX = 'order_v1:';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store, max-age=0',
    },
  });
}

function badRequest(msg) {
  return json({ ok: false, error: msg || 'bad_request' }, 400);
}

function getClientIP(request) {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for') ||
    ''
  );
}

function safeString(v, maxLen = 500) {
  if (v === null || v === undefined) return '';
  let s = String(v);
  if (s.length > maxLen) s = s.slice(0, maxLen);
  return s;
}

function normalizeOrderPayload(body) {
  // Accept any shape, but normalize common fields
  const out = {
    created_at: new Date().toISOString(),
    source: 'checkout',
    customer: {
      name: safeString(body?.name || body?.nome),
      phone: safeString(body?.phone || body?.telefone || body?.whatsapp),
      email: safeString(body?.email),
      cpf: safeString(body?.cpf),
    },
    shipping: {
      cep: safeString(body?.cep),
      address: safeString(body?.address || body?.endereco),
      number: safeString(body?.number || body?.numero),
      complement: safeString(body?.complement || body?.complemento),
      neighborhood: safeString(body?.neighborhood || body?.bairro),
      city: safeString(body?.city || body?.cidade),
      state: safeString(body?.state || body?.uf),
    },
    product: {
      id: safeString(body?.product_id || body?.productId || body?.sku),
      name: safeString(body?.product_name || body?.productName),
      variant: safeString(body?.variant),
      qty: body?.qty ?? body?.quantity ?? 1,
      price: body?.price ?? body?.value ?? null,
      currency: safeString(body?.currency || 'BRL', 8),
    },
    utm: {
      utm_source: safeString(body?.utm_source),
      utm_medium: safeString(body?.utm_medium),
      utm_campaign: safeString(body?.utm_campaign),
      utm_content: safeString(body?.utm_content),
      utm_term: safeString(body?.utm_term),
    },
    meta: {
      page: safeString(body?.page || body?.url),
      user_agent: safeString(body?.user_agent),
      ip: safeString(body?.ip),
      referrer: safeString(body?.referrer),
    },
    raw: body, // keep original
  };

  // remove empty customer/shipping fields if all blank (optional)
  return out;
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.PIX_STORE) {
    return json({ ok: false, error: 'PIX_STORE_KV_NOT_BOUND' }, 500);
  }

  let body;
  const ct = request.headers.get('content-type') || '';
  try {
    if (ct.includes('application/json')) {
      body = await request.json();
    } else if (ct.includes('application/x-www-form-urlencoded') || ct.includes('multipart/form-data')) {
      const form = await request.formData();
      body = Object.fromEntries(form.entries());
    } else {
      // try json anyway
      body = await request.json();
    }
  } catch (e) {
    return badRequest('INVALID_BODY');
  }

  const order = normalizeOrderPayload(body);
  order.meta.ip = order.meta.ip || getClientIP(request);
  order.meta.user_agent = order.meta.user_agent || (request.headers.get('user-agent') || '');
  order.meta.referrer = order.meta.referrer || (request.headers.get('referer') || '');

  const ts = Date.now();
  const rand = Math.random().toString(16).slice(2, 10);
  const key = `${PREFIX}${ts}:${rand}`;

  // keep 90 days (adjust if you want)
  await env.PIX_STORE.put(key, JSON.stringify(order), { expirationTtl: 60 * 60 * 24 * 90 });

  return json({ ok: true, key, created_at: order.created_at });
}
