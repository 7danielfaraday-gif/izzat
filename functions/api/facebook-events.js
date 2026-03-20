// Cloudflare Pages Function: POST /api/facebook-events
// Purpose: Meta Conversions API (CAPI) — envia eventos server-side espelhando o browser pixel
//
// Variáveis de ambiente necessárias (Cloudflare Pages → Settings → Environment Variables):
//   FB_PIXEL_ID          — ID do pixel Facebook/Meta (ex: "1477467864082559")
//   FB_ACCESS_TOKEN      — Token gerado no Events Manager → Conversions API → Settings
//   FB_TEST_EVENT_CODE   — (opcional) código de teste para validar sem afetar dados reais
//
// Deduplicação: o browser envia o mesmo event_id que este endpoint.
// O Meta detecta o par (browser + server) com o mesmo event_id e mantém apenas 1.

const FB_GRAPH_API_VERSION = 'v21.0';

// Campos aceitos no user_data (Facebook CAPI)
const USER_DATA_FIELDS = ['em', 'ph', 'external_id', 'fbc', 'fbp'];

// Campos aceitos no custom_data
const CUSTOM_DATA_FIELDS = [
  'currency', 'value', 'contents', 'content_ids', 'content_type',
  'content_name', 'content_category', 'num_items', 'order_id',
  'search_string', 'status', 'delivery_category'
];

// Mapeamento de nomes de evento TikTok → Facebook (para compatibilidade com código legado)
const EVENT_NAME_MAP = {
  'Pageview':           'PageView',
  'LandingPageView':    'ViewContent',
  'ViewContent':        'ViewContent',
  'AddToCart':          'AddToCart',
  'InitiateCheckout':   'InitiateCheckout',
  'AddPaymentInfo':     'AddPaymentInfo',
  'CompletePayment':    'Purchase',
  'Purchase':           'Purchase',
  'SubmitForm':         'Lead',
  'PlaceAnOrder':       'Purchase',
  'ClickButton':        'Lead',
  'CompleteRegistration': 'CompleteRegistration',
  'Contact':            'Contact',
  'Search':             'Search',
  'Subscribe':          'Subscribe',
};


function normalizeEventSourceUrl(value) {
  try {
    const base = value ? new URL(value) : new URL('https://lojaizzat.shop/');
    base.protocol = 'https:';
    base.host = 'lojaizzat.shop';
    return base.toString();
  } catch {
    return 'https://lojaizzat.shop/';
  }
}

function isSha256Hex(value) {
  return typeof value === 'string' && /^[a-f0-9]{64}$/i.test(value.trim());
}

function buildSafeUserData(user) {
  const safe = {};

  // em (email) — deve ser SHA256 hash
  if (user.em && isSha256Hex(user.em)) {
    safe.em = [user.em.trim().toLowerCase()];
  } else if (user.email && isSha256Hex(user.email)) {
    safe.em = [user.email.trim().toLowerCase()];
  }

  // ph (phone) — deve ser SHA256 hash
  const rawPhone = user.ph || user.phone || user.phone_number;
  if (rawPhone && isSha256Hex(rawPhone)) {
    safe.ph = [rawPhone.trim().toLowerCase()];
  }

  // external_id — deve ser SHA256 hash
  if (user.external_id && isSha256Hex(user.external_id)) {
    safe.external_id = [user.external_id.trim().toLowerCase()];
  }

  // fbc (Facebook Click ID cookie) — formato: fb.1.{timestamp}.{fbclid}
  if (user.fbc && typeof user.fbc === 'string') {
    safe.fbc = user.fbc;
  }

  // fbp (Facebook Browser ID cookie) — formato: fb.1.{timestamp}.{random}
  if (user.fbp && typeof user.fbp === 'string') {
    safe.fbp = user.fbp;
  }

  return safe;
}

function json(data, status = 200, request = null) {
  const headers = {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store, max-age=0',
  };
  if (request) {
    headers['access-control-allow-origin'] = getAllowedOrigin(request);
  }
  return new Response(JSON.stringify(data), { status, headers });
}

function pick(obj, fields) {
  if (!obj || typeof obj !== 'object') return {};
  const out = {};
  for (const f of fields) {
    if (obj[f] !== undefined && obj[f] !== null && obj[f] !== '') {
      out[f] = obj[f];
    }
  }
  return out;
}

function getAllowedOrigin(request) {
  const reqOrigin = request.headers.get('origin');
  if (reqOrigin) return reqOrigin;
  return new URL(request.url).origin;
}

function corsHeaders(request) {
  return {
    'access-control-allow-origin': getAllowedOrigin(request),
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'access-control-expose-headers': 'content-type',
  };
}

export async function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: {
      ...corsHeaders(context.request),
      'cache-control': 'no-store',
    },
  });
}

export async function onRequestPost(context) {
  try {
    const env = context.env;

    // ── Validação de credenciais ──────────────────────────────────────────────
    const pixelId     = env.FB_PIXEL_ID;
    const accessToken = env.FB_ACCESS_TOKEN;
    const testCode    = env.FB_TEST_EVENT_CODE || undefined;

    if (!pixelId || pixelId.indexOf('REPLACE') !== -1) {
      // Pixel ainda não configurado — ignora silenciosamente para não quebrar o checkout
      return json({ ok: true, skipped: 'pixel_not_configured' }, 200, context.request);
    }
    if (!accessToken) {
      return json({ ok: false, error: 'access_token_not_configured' }, 500, context.request);
    }

    // ── Parse do body enviado pelo browser ───────────────────────────────────
    let body = null;
    try { body = await context.request.json(); } catch { body = {}; }

    const rawEvent   = typeof body.event === 'string' ? body.event : (typeof body.event_name === 'string' ? body.event_name : null);
    const event_id   = typeof body.event_id === 'string' ? body.event_id : null;
    const properties = body.properties || body.custom_data || {};
    const user       = body.user       || body.user_data  || {};

    if (!rawEvent) return json({ ok: false, error: 'missing_event' }, 400, context.request);

    // Normaliza nome do evento (aceita nomes no padrão TikTok por retrocompatibilidade)
    const event_name = EVENT_NAME_MAP[rawEvent] || rawEvent;

    // ── Metadados server-side (mais confiáveis que o browser) ─────────────────
    const ip        = context.request.headers.get('cf-connecting-ip')
                   || context.request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
                   || undefined;
    const userAgent = context.request.headers.get('user-agent') || undefined;

    // ── URL da página ────────────────────────────────────────────────────────
    const eventSourceUrl = normalizeEventSourceUrl(
      context.request.headers.get('referer') ||
      properties.event_source_url ||
      undefined
    );

    // ── Monta user_data para a Conversions API ───────────────────────────────
    const userData = {
      ...buildSafeUserData(user),
      ...(ip        && { client_ip_address: ip }),
      ...(userAgent && { client_user_agent: userAgent }),
    };

    // ── Monta custom_data ────────────────────────────────────────────────────
    const customData = pick(properties, CUSTOM_DATA_FIELDS);

    // Garante content_ids sempre presente: extrai do contents[] se não vier no top-level
    if (!customData.content_ids && Array.isArray(properties.contents) && properties.contents[0]?.content_id) {
      customData.content_ids = properties.contents.map(c => c.content_id || c.id).filter(Boolean);
    }

    // Mapeia contents para formato Facebook: { id, quantity, item_price }
    if (Array.isArray(properties.contents)) {
      customData.contents = properties.contents.map(c => ({
        id: c.content_id || c.id,
        quantity: c.quantity || 1,
        ...(c.item_price !== undefined ? { item_price: c.item_price } : {}),
        ...(c.price !== undefined && c.item_price === undefined ? { item_price: c.price } : {}),
      }));
    }

    // Garante currency e value
    if (properties.currency && !customData.currency) customData.currency = properties.currency;
    if (properties.value !== undefined && customData.value === undefined) customData.value = properties.value;

    // Remove chaves vazias
    for (const section of [userData, customData]) {
      for (const k of Object.keys(section)) {
        if (section[k] === undefined || section[k] === null || section[k] === '') {
          delete section[k];
        }
      }
    }

    // ── Monta payload para a Conversions API ─────────────────────────────────
    const eventPayload = {
      event_name:       event_name,
      event_time:       Math.floor(Date.now() / 1000),
      action_source:    'website',
      event_source_url: eventSourceUrl,
      ...(event_id && { event_id }),
      user_data:   userData,
      custom_data: customData,
    };

    // ── Disparo para a Conversions API ───────────────────────────────────────
    const apiUrl = `https://graph.facebook.com/${FB_GRAPH_API_VERSION}/${pixelId}/events?access_token=${accessToken}`;

    const apiBody = JSON.stringify({
      data: [eventPayload],
      ...(testCode && { test_event_code: testCode }),
    });

    const apiRes = await fetch(apiUrl, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: apiBody,
    });

    let apiJson = null;
    try { apiJson = await apiRes.json(); } catch { apiJson = null; }

    // Log detalhado para debug (visível no Cloudflare Workers Logs → Real-time)
    console.log('[facebook-events]', JSON.stringify({
      event_name,
      event_id: event_id || null,
      status: apiRes.status,
      response: apiJson,
    }));

    if (!apiRes.ok) {
      console.error('[facebook-events] API error', apiRes.status, JSON.stringify(apiJson));
      return json({ ok: false, error: 'api_error', status: apiRes.status, detail: apiJson }, 200, context.request);
    }

    return json({ ok: true, event: event_name, event_id: event_id || null }, 200, context.request);

  } catch (err) {
    console.error('[facebook-events] Unexpected error:', err);
    return json({ ok: false, error: 'server_error' }, 500, context.request);
  }
}
