// Cloudflare Pages Function: POST /api/order
// Recebe os dados do checkout e envia um e-mail de notificação com o pedido.
// Envio via MailChannels (sem API key) — funciona em Workers/Pages.
//
// ✅ Secrets (Pages > Settings > Environment variables):
// - ORDER_NOTIFY_TO (OBRIGATÓRIO): e-mail que recebe os pedidos
// - ORDER_NOTIFY_FROM (OPCIONAL): remetente (recomendado ser do seu domínio)
//
// ✅ DNS (recomendado para não cair no spam):
// TXT no @: v=spf1 include:mailchannels.net -all

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store, max-age=0',
    },
  });
}

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function buildFromEmail(env, requestUrl) {
  const fromEnv = safeStr(env.ORDER_NOTIFY_FROM);
  if (fromEnv) return fromEnv;
  try {
    const u = new URL(requestUrl);
    const host = (u.hostname || 'example.com').replace(/^www\./i, '');
    return `pedidos@${host}`;
  } catch (_) {
    return 'pedidos@example.com';
  }
}

function formatOrderText(payload) {
  const lines = [];
  lines.push('NOVO PEDIDO (PIX PENDENTE)');
  lines.push('');
  lines.push(`Order ID: ${safeStr(payload.order_id)}`);
  lines.push(`Data/Hora (UTC): ${new Date().toISOString()}`);
  lines.push('');

  lines.push('CLIENTE');
  lines.push(`Nome: ${safeStr(payload.name)}`);
  lines.push(`E-mail: ${safeStr(payload.email)}`);
  lines.push(`Telefone: ${safeStr(payload.phone)}`);
  if (safeStr(payload.cpf)) lines.push(`CPF: ${safeStr(payload.cpf)}`);
  lines.push('');

  lines.push('ENDEREÇO');
  lines.push(`CEP: ${safeStr(payload.cep)}`);
  lines.push(`Rua: ${safeStr(payload.address)}`);
  lines.push(`Número: ${safeStr(payload.number)}`);
  lines.push(`Cidade/UF: ${safeStr(payload.city)}${safeStr(payload.state) ? '/' + safeStr(payload.state) : ''}`);
  lines.push('');

  const p = payload.product || {};
  if (p && typeof p === 'object') {
    lines.push('PRODUTO');
    if (safeStr(p.id)) lines.push(`SKU/ID: ${safeStr(p.id)}`);
    if (safeStr(p.name)) lines.push(`Nome: ${safeStr(p.name)}`);
    if (safeStr(p.price)) lines.push(`Preço: ${safeStr(p.price)}`);
    lines.push('');
  }

  const utms = payload.utms || {};
  if (utms && typeof utms === 'object' && Object.keys(utms).length) {
    lines.push('UTMS');
    for (const k of Object.keys(utms)) {
      const v = utms[k];
      const vv = typeof v === 'string' ? v : (v == null ? '' : String(v));
      if (vv) lines.push(`${k}: ${vv}`);
    }
    lines.push('');
  }

  if (safeStr(payload.page)) {
    lines.push(`Página: ${safeStr(payload.page)}`);
    lines.push('');
  }
  return lines.join('\n');
}

async function sendMail({ to, fromEmail, fromName, subject, text, replyTo }) {
  const body = {
    personalizations: [{ to: [{ email: to }] }],
    from: { email: fromEmail, name: fromName },
    subject,
    content: [{ type: 'text/plain', value: text }],
  };
  if (replyTo) body.reply_to = { email: replyTo };

  const resp = await fetch('https://api.mailchannels.net/tx/v1/send', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const t = await resp.text().catch(() => '');
    throw new Error(`mail_failed_${resp.status}${t ? '_' + t.slice(0, 200) : ''}`);
  }
}

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const to = safeStr(env.ORDER_NOTIFY_TO);
    if (!to) return json({ ok: false, error: 'missing_ORDER_NOTIFY_TO' }, 500);

    const ct = request.headers.get('content-type') || '';
    if (!ct.toLowerCase().includes('application/json')) {
      return json({ ok: false, error: 'content_type_must_be_json' }, 415);
    }

    const payload = await request.json().catch(() => null);
    if (!payload || typeof payload !== 'object') {
      return json({ ok: false, error: 'invalid_json' }, 400);
    }

    const orderId = safeStr(payload.order_id);
    if (!orderId) return json({ ok: false, error: 'missing_order_id' }, 400);

    const fromEmail = buildFromEmail(env, request.url);
    const fromName = 'Pedidos Izzat';
    const subject = `Novo pedido (PIX pendente) — ${orderId}`;
    const text = formatOrderText(payload);
    const replyTo = safeStr(payload.email) || null;

    await sendMail({ to, fromEmail, fromName, subject, text, replyTo });
    return json({ ok: true });
  } catch (e) {
    return json({ ok: false, error: 'server_error' }, 500);
  }
}

export async function onRequestGet() {
  return json({ ok: false, error: 'method_not_allowed' }, 405);
}
