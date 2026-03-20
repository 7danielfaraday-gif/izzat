// Cloudflare Pages Function: POST /api/facebook-events
// Purpose: Facebook Conversions API (CAPI) — envia eventos server-side espelhando o browser pixel
//
// Variáveis de ambiente necessárias (Cloudflare Pages → Settings → Environment Variables):
//   FB_PIXEL_ID      — ID do pixel Facebook (ex: "1477467864082559")
//   FB_ACCESS_TOKEN  — Token de acesso gerado no Events Manager → seu pixel → Configurações → API de Conversões
//
// Deduplicação: o browser envia o mesmo event_id (eventID) que este endpoint.
// O Facebook detecta o par (browser + server) com o mesmo event_id e mantém apenas 1.

const FB_GRAPH_API = 'https://graph.facebook.com/v19.0/';

// Mapeamento de eventos TikTok → Facebook (compatibilidade)
const EVENT_MAP = {
  'CompletePayment': 'Purchase',
  'Pageview':        'PageView',
};

function normalizeEventName(name) {
  return EVENT_MAP[name] || name;
}

function isSha256Hex(value) {
  return typeof value === 'string' && /^[a-f0-9]{64}$/i.test(value.trim());
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

    const eventName  = typeof body.event === 'string' ? normalizeEventName(body.event) : null;
    const eventId    = typeof body.event_id === 'string' ? body.event_id : null;
    const properties = body.properties || {};
    const user       = body.user       || {};

    if (!eventName) return json({ ok: false, error: 'missing_event' }, 400, context.request);

    // ── Metadados server-side ─────────────────────────────────────────────────
    const ip        = context.request.headers.get('cf-connecting-ip')
                   || context.request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
                   || undefined;
    const userAgent = context.request.headers.get('user-agent') || undefined;

    // ── Monta user_data ───────────────────────────────────────────────────────
    const userData = {};

    // Dados hasheados (SHA-256 hex)
    if (isSha256Hex(user.email))       userData.em  = [user.email.trim().toLowerCase()];
    if (isSha256Hex(user.phone))       userData.ph  = [user.phone.trim()];
    if (isSha256Hex(user.phone_number)) userData.ph = [user.phone_number.trim()];
    if (isSha256Hex(user.external_id)) userData.external_id = [user.external_id.trim()];

    // Parâmetros de click/browser do Facebook
    if (user.fbc)  userData.fbc  = user.fbc;   // _fbc cookie ou fbclid param
    if (user.fbp)  userData.fbp  = user.fbp;   // _fbp cookie

    // Server-side enrichment
    if (ip)        userData.client_ip_address  = ip;
    if (userAgent) userData.client_user_agent  = userAgent;

    // ── Monta custom_data ─────────────────────────────────────────────────────
    const customData = {};

    if (properties.currency)     customData.currency      = properties.currency;
    if (properties.value != null) customData.value        = properties.value;
    if (properties.order_id)     customData.order_id      = properties.order_id;
    if (properties.content_name) customData.content_name  = properties.content_name;
    if (properties.content_type) customData.content_type  = properties.content_type;

    // content_ids
    const contentIds = properties.content_ids
      || (Array.isArray(properties.contents)
          ? properties.contents.map(c => c.content_id || c.id).filter(Boolean)
          : null)
      || (properties.content_id ? [properties.content_id] : null);

    if (contentIds && contentIds.length > 0) customData.content_ids = contentIds;

    // contents
    if (Array.isArray(properties.contents) && properties.contents.length > 0) {
      customData.contents = properties.contents.map(c => ({
        id:         c.content_id || c.id,
        quantity:   c.quantity   || 1,
        item_price: c.item_price || c.price || undefined,
      }));
    }

    // ── Monta evento ──────────────────────────────────────────────────────────
    const eventSourceUrl = (() => {
      try {
        const referer = context.request.headers.get('referer') || properties.event_source_url || '';
        const u = referer ? new URL(referer) : new URL('https://lojaizzat.shop/');
        u.protocol = 'https:';
        u.host = 'lojaizzat.shop';
        return u.toString();
      } catch {
        return 'https://lojaizzat.shop/';
      }
    })();

    const eventData = {
      event_name:          eventName,
      event_time:          Math.floor(Date.now() / 1000),
      event_source_url:    eventSourceUrl,
      action_source:       'website',
      user_data:           userData,
      ...(Object.keys(customData).length > 0 && { custom_data: customData }),
      ...(eventId && { event_id: eventId }),
    };

    // ── Disparo para a Conversions API ────────────────────────────────────────
    const apiUrl = `${FB_GRAPH_API}${pixelId}/events?access_token=${accessToken}`;

    const apiBody = JSON.stringify({
      data: [eventData],
    });

    const apiRes = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: apiBody,
    });

    let apiJson = null;
    try { apiJson = await apiRes.json(); } catch { apiJson = null; }

    console.log('[facebook-events]', JSON.stringify({
      event:    eventName,
      event_id: eventId || null,
      status:   apiRes.status,
      response: apiJson,
    }));

    if (!apiRes.ok) {
      console.error('[facebook-events] API error', apiRes.status, JSON.stringify(apiJson));
      return json({ ok: false, error: 'api_error', status: apiRes.status, detail: apiJson }, 200, context.request);
    }

    return json({ ok: true, event: eventName, event_id: eventId || null }, 200, context.request);

  } catch (err) {
    console.error('[facebook-events] Unexpected error:', err);
    return json({ ok: false, error: 'server_error' }, 500, context.request);
  }
}
