// Cloudflare Pages Function: GET /admin/pedidos
// Shows a simple Orders admin page behind HTTP Basic Auth.
// Secrets required: PIX_ADMIN_USER, PIX_ADMIN_PASS
//
// Data endpoint it uses: GET /api/orders-admin (also protected with same Basic Auth)

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

function html(body, status = 200) {
  return new Response(body, {
    status,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store, max-age=0',
    },
  });
}

export async function onRequestGet(context) {
  if (!checkBasicAuth(context.request, context.env)) return unauthorized();

  return html(`<!doctype html>
<html lang="pt-br">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Pedidos</title>
  <style>
    :root { color-scheme: light; }
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; margin: 0; background: #0b1220; color: #e5e7eb; }
    .wrap { max-width: 1100px; margin: 0 auto; padding: 28px 18px 60px; }
    .top { display:flex; gap: 10px; align-items:center; justify-content: space-between; flex-wrap: wrap; }
    .card { background: #111a2e; border: 1px solid rgba(255,255,255,.08); border-radius: 16px; padding: 16px; box-shadow: 0 20px 50px rgba(0,0,0,.35); }
    h1 { margin: 0; font-size: 22px; }
    p { margin: 6px 0 0; opacity: .9; }
    button { border: 0; border-radius: 12px; padding: 10px 12px; background: #ff7a00; color: #111; font-weight: 700; cursor: pointer; }
    button:active { transform: translateY(1px); }
    .muted { opacity: .75; font-size: 12px; }
    .grid { display: grid; grid-template-columns: 1fr; gap: 12px; margin-top: 14px; }
    .row { display:flex; gap: 10px; flex-wrap: wrap; }
    .row > div { flex: 1 1 240px; min-width: 220px; }
    .k { font-size: 12px; opacity: .7; margin-bottom: 4px; }
    .v { font-size: 14px; word-break: break-word; }
    .pill { display:inline-block; font-size: 12px; padding: 4px 10px; border-radius: 999px; border: 1px solid rgba(255,255,255,.12); opacity: .9; }
    .table { width: 100%; border-collapse: collapse; }
    .table th, .table td { text-align: left; padding: 10px 8px; border-bottom: 1px solid rgba(255,255,255,.08); vertical-align: top; }
    .table th { font-size: 12px; opacity: .8; font-weight: 600; }
    .table td { font-size: 13px; }
    .small { font-size: 12px; opacity: .9; }
    a { color: #93c5fd; }
    .danger { color: #fecaca; }
    .ok { color: #bbf7d0; }
    .copy { background: rgba(255,255,255,.08); color: #e5e7eb; padding: 6px 8px; border-radius: 10px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="top">
      <div>
        <h1>📦 Pedidos (registro do checkout)</h1>
        <p class="muted">Mostra os últimos pedidos enviados pelo checkout. Status: PIX pendente (confirmação manual).</p>
      </div>
      <div class="row" style="align-items:center;">
        <button id="btnReload">Atualizar</button>
        <a class="muted" href="/admin" style="text-decoration:none;">⬅️ Painel PIX</a>
      </div>
    </div>

    <div class="card" style="margin-top:14px;">
      <div id="status" class="muted">Carregando…</div>
      <div style="overflow:auto; margin-top:10px;">
        <table class="table" id="tbl" style="display:none;">
          <thead>
            <tr>
              <th>Data</th>
              <th>Cliente</th>
              <th>Contato</th>
              <th>Endereço</th>
              <th>Produto</th>
              <th>UTM</th>
            </tr>
          </thead>
          <tbody id="tbody"></tbody>
        </table>
      </div>
    </div>

    <div class="muted" style="margin-top:10px;">
      Dica: se quiser exportar, posso adicionar um botão de CSV aqui 😉
    </div>
  </div>

<script>
  const statusEl = document.getElementById('status');
  const tbl = document.getElementById('tbl');
  const tbody = document.getElementById('tbody');
  const btnReload = document.getElementById('btnReload');

  function esc(s) {
    return String(s ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
  }

  function fmtDate(iso) {
    try {
      const d = new Date(iso);
      return d.toLocaleString('pt-BR');
    } catch { return iso || ''; }
  }

  function joinAddr(o) {
    if (!o) return '';
    const parts = [
      o.address || o.endereco,
      o.number || o.numero,
      o.neighborhood || o.bairro,
      o.city || o.cidade,
      o.state || o.uf,
      o.cep
    ].filter(Boolean);
    return parts.join(' • ');
  }

  function joinUTM(u) {
    if (!u) return '';
    const parts = [];
    ['utm_source','utm_medium','utm_campaign','utm_content','utm_term'].forEach(k => {
      if (u[k]) parts.push(k.replace('utm_','') + '=' + u[k]);
    });
    return parts.join(' | ');
  }

  async function load() {
    statusEl.textContent = 'Carregando…';
    tbl.style.display = 'none';
    tbody.innerHTML = '';

    let resp;
    try {
      resp = await fetch('/api/orders-admin?limit=80', { cache: 'no-store' });
    } catch (e) {
      statusEl.innerHTML = '<span class="danger">Falha de rede.</span>';
      return;
    }

    if (resp.status === 401) {
      statusEl.innerHTML = '<span class="danger">Não autorizado.</span> (confira usuário/senha do admin)';
      return;
    }

    if (!resp.ok) {
      const txt = await resp.text();
      statusEl.innerHTML = '<span class="danger">Erro:</span> ' + esc(txt);
      return;
    }

    const data = await resp.json();
    const orders = data.orders || [];

    statusEl.innerHTML = '<span class="ok">OK</span> • ' + orders.length + ' pedido(s)';
    tbl.style.display = orders.length ? '' : 'none';

    for (const o of orders) {
      const c = o.customer || {};
      const s = o.shipping || {};
      const p = o.product || {};
      const u = o.utm || {};

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="small">${esc(fmtDate(o.created_at))}</td>
        <td>
          <div><strong>${esc(c.name || '-') }</strong></div>
          <div class="muted">CPF: ${esc(c.cpf || '-')}</div>
        </td>
        <td>
          <div>📱 ${esc(c.phone || '-')}</div>
          <div>✉️ ${esc(c.email || '-')}</div>
        </td>
        <td class="small">${esc(joinAddr(s) || '-')}</td>
        <td class="small">${esc(p.name || p.id || '-')} <div class="muted">Qtd: ${esc(p.qty ?? 1)}</div></td>
        <td class="small">${esc(joinUTM(u) || '-')}</td>
      `;
      tbody.appendChild(tr);
    }
  }

  btnReload.addEventListener('click', load);
  load();
</script>
</body>
</html>`);
}
