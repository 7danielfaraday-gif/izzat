// ============================================================
// Izzat Express - Sistema de Rastreio
// Cloudflare Workers + KV
// ============================================================

const ADMIN_PASSWORD = "izzat2024"; // Altere esta senha!

const STATUS_TIMELINE = [
  { status: "Pedido processado", description: "Seu pedido foi recebido e está sendo processado.", icon: "📦" },
  { status: "Em preparação", description: "Seu pedido está sendo preparado para envio.", icon: "🔧" },
  { status: "Pedido despachado", description: "Seu pedido foi despachado do nosso centro.", icon: "📤" },
  { status: "Pedido recebido pela transportadora", description: "A transportadora recebeu seu pedido.", icon: "🚚" },
  { status: "Em trânsito para o centro de distribuição", description: "Seu pedido está a caminho do centro de distribuição da sua região.", icon: "🛣️" },
  { status: "Pedido no centro de distribuição", description: "Seu pedido chegou ao centro de distribuição mais próximo.", icon: "🏭" },
  { status: "Pedido saiu para entrega", description: "Seu pedido está a caminho! Aguarde o entregador.", icon: "🏍️" },
  { status: "Pedido entregue", description: "Seu pedido foi entregue com sucesso!", icon: "✅" },
];

function generateId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "IZT";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function getCurrentStatus(createdAt) {
  const now = new Date();
  const created = new Date(createdAt);
  const diffTime = now.getTime() - created.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  const statusIndex = Math.min(diffDays, STATUS_TIMELINE.length - 1);
  return statusIndex;
}

function getStatusHistory(createdAt) {
  const currentIndex = getCurrentStatus(createdAt);
  const created = new Date(createdAt);
  const history = [];

  for (let i = 0; i <= currentIndex; i++) {
    const date = new Date(created);
    date.setDate(date.getDate() + i);
    history.push({
      ...STATUS_TIMELINE[i],
      date: date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      timestamp: date.toISOString(),
    });
  }

  return history;
}

function getEstimatedDelivery(createdAt) {
  const created = new Date(createdAt);
  const delivery = new Date(created);
  delivery.setDate(delivery.getDate() + 7);
  return delivery.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ============================================================
// Request Handler
// ============================================================

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // ---- Pages ----
      if (path === "/" || path === "/admin") {
        return new Response(getAdminHTML(), {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }

      if (path.startsWith("/rastreio/")) {
        const trackingId = path.split("/rastreio/")[1].replace(/[^A-Z0-9]/gi, "");
        return new Response(getTrackingHTML(trackingId), {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }

      // ---- API ----

      // Criar pedido
      if (path === "/api/orders" && request.method === "POST") {
        const auth = request.headers.get("Authorization");
        if (auth !== `Bearer ${ADMIN_PASSWORD}`) {
          return Response.json({ error: "Não autorizado" }, { status: 401, headers: corsHeaders });
        }

        const body = await request.json();
        const { nome, endereco } = body;

        if (!nome || !endereco) {
          return Response.json({ error: "Nome e endereço são obrigatórios" }, { status: 400, headers: corsHeaders });
        }

        const trackingId = generateId();
        const order = {
          id: trackingId,
          nome: nome.trim(),
          endereco: endereco.trim(),
          createdAt: new Date().toISOString(),
        };

        await env.RASTREIO_KV.put(`order:${trackingId}`, JSON.stringify(order));

        // Add to index
        let index = await env.RASTREIO_KV.get("orders:index", { type: "json" });
        if (!index) index = [];
        index.unshift(trackingId);
        await env.RASTREIO_KV.put("orders:index", JSON.stringify(index));

        return Response.json({ success: true, order, trackingUrl: `${url.origin}/rastreio/${trackingId}` }, { headers: corsHeaders });
      }

      // Listar pedidos
      if (path === "/api/orders" && request.method === "GET") {
        const auth = request.headers.get("Authorization");
        if (auth !== `Bearer ${ADMIN_PASSWORD}`) {
          return Response.json({ error: "Não autorizado" }, { status: 401, headers: corsHeaders });
        }

        let index = await env.RASTREIO_KV.get("orders:index", { type: "json" });
        if (!index) index = [];

        const orders = [];
        for (const id of index) {
          const order = await env.RASTREIO_KV.get(`order:${id}`, { type: "json" });
          if (order) {
            const currentIdx = getCurrentStatus(order.createdAt);
            orders.push({
              ...order,
              currentStatus: STATUS_TIMELINE[currentIdx].status,
              estimatedDelivery: getEstimatedDelivery(order.createdAt),
              trackingUrl: `${url.origin}/rastreio/${order.id}`,
            });
          }
        }

        return Response.json({ orders }, { headers: corsHeaders });
      }

      // Deletar pedido
      if (path.startsWith("/api/orders/") && request.method === "DELETE") {
        const auth = request.headers.get("Authorization");
        if (auth !== `Bearer ${ADMIN_PASSWORD}`) {
          return Response.json({ error: "Não autorizado" }, { status: 401, headers: corsHeaders });
        }

        const orderId = path.split("/api/orders/")[1];
        await env.RASTREIO_KV.delete(`order:${orderId}`);

        let index = await env.RASTREIO_KV.get("orders:index", { type: "json" });
        if (index) {
          index = index.filter((id) => id !== orderId);
          await env.RASTREIO_KV.put("orders:index", JSON.stringify(index));
        }

        return Response.json({ success: true }, { headers: corsHeaders });
      }

      // Buscar rastreio (público)
      if (path.startsWith("/api/tracking/")) {
        const trackingId = path.split("/api/tracking/")[1];
        const order = await env.RASTREIO_KV.get(`order:${trackingId}`, { type: "json" });

        if (!order) {
          return Response.json({ error: "Pedido não encontrado" }, { status: 404, headers: corsHeaders });
        }

        const currentIdx = getCurrentStatus(order.createdAt);
        const history = getStatusHistory(order.createdAt);

        return Response.json({
          id: order.id,
          nome: order.nome,
          endereco: order.endereco,
          currentStatus: STATUS_TIMELINE[currentIdx].status,
          estimatedDelivery: getEstimatedDelivery(order.createdAt),
          history,
          totalSteps: STATUS_TIMELINE.length,
          currentStep: currentIdx + 1,
        }, { headers: corsHeaders });
      }

      return new Response("Não encontrado", { status: 404 });
    } catch (err) {
      return Response.json({ error: "Erro interno do servidor" }, { status: 500, headers: corsHeaders });
    }
  },
};

// ============================================================
// Admin Panel HTML
// ============================================================
function getAdminHTML() {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Izzat - Painel de Rastreio</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    :root {
      --orange-50: #fff7ed;
      --orange-100: #ffedd5;
      --orange-200: #fed7aa;
      --orange-300: #fdba74;
      --orange-400: #fb923c;
      --orange-500: #f97316;
      --orange-600: #ea580c;
      --orange-700: #c2410c;
      --gray-50: #f9fafb;
      --gray-100: #f3f4f6;
      --gray-200: #e5e7eb;
      --gray-300: #d1d5db;
      --gray-400: #9ca3af;
      --gray-500: #6b7280;
      --gray-600: #4b5563;
      --gray-700: #374151;
      --gray-800: #1f2937;
      --gray-900: #111827;
      --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
      --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05);
      --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.05);
      --shadow-xl: 0 20px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.05);
    }

    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background: var(--gray-50);
      color: var(--gray-800);
      min-height: 100vh;
    }

    /* Login Screen */
    .login-overlay {
      position: fixed; inset: 0;
      background: linear-gradient(135deg, var(--orange-500) 0%, var(--orange-700) 100%);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000;
      transition: opacity 0.5s, visibility 0.5s;
    }

    .login-overlay.hidden {
      opacity: 0; visibility: hidden; pointer-events: none;
    }

    .login-card {
      background: white;
      border-radius: 24px;
      padding: 48px 40px;
      width: 100%; max-width: 420px;
      box-shadow: 0 25px 50px rgba(0,0,0,0.15);
      text-align: center;
    }

    .login-card .logo-text {
      font-size: 36px; font-weight: 800;
      color: var(--gray-900);
      letter-spacing: -1px;
    }

    .login-card .logo-text span { color: var(--orange-500); }

    .login-card .subtitle {
      color: var(--gray-400);
      font-size: 14px;
      margin-top: 4px;
      letter-spacing: 3px;
      text-transform: uppercase;
      font-weight: 500;
    }

    .login-card input {
      width: 100%;
      padding: 14px 18px;
      border: 2px solid var(--gray-200);
      border-radius: 12px;
      font-size: 15px;
      margin-top: 32px;
      transition: border-color 0.2s;
      outline: none;
      font-family: inherit;
    }

    .login-card input:focus { border-color: var(--orange-400); }

    .login-card button {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, var(--orange-500), var(--orange-600));
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      margin-top: 16px;
      transition: transform 0.15s, box-shadow 0.15s;
      font-family: inherit;
    }

    .login-card button:hover {
      transform: translateY(-1px);
      box-shadow: 0 8px 20px rgba(249,115,22,0.35);
    }

    .login-error {
      color: #ef4444;
      font-size: 13px;
      margin-top: 12px;
      display: none;
    }

    /* Header */
    .header {
      background: white;
      border-bottom: 1px solid var(--gray-200);
      padding: 0 32px;
      height: 72px;
      display: flex; align-items: center; justify-content: space-between;
      position: sticky; top: 0; z-index: 50;
    }

    .header-logo {
      font-size: 24px; font-weight: 800;
      color: var(--gray-900);
      letter-spacing: -0.5px;
    }

    .header-logo span { color: var(--orange-500); }

    .header-badge {
      background: var(--orange-50);
      color: var(--orange-600);
      font-size: 11px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 20px;
      margin-left: 12px;
      letter-spacing: 1px;
      text-transform: uppercase;
    }

    .header-right { display: flex; align-items: center; gap: 12px; }

    .btn-logout {
      padding: 8px 16px;
      background: var(--gray-100);
      border: 1px solid var(--gray-200);
      border-radius: 10px;
      font-size: 13px;
      color: var(--gray-600);
      cursor: pointer;
      font-weight: 500;
      transition: all 0.15s;
      font-family: inherit;
    }

    .btn-logout:hover { background: var(--gray-200); }

    /* Main */
    .main { max-width: 1100px; margin: 0 auto; padding: 32px 24px; }

    /* Stats */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }

    .stat-card {
      background: white;
      border-radius: 16px;
      padding: 24px;
      border: 1px solid var(--gray-200);
      transition: box-shadow 0.2s;
    }

    .stat-card:hover { box-shadow: var(--shadow-md); }

    .stat-label {
      font-size: 13px;
      color: var(--gray-400);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .stat-value {
      font-size: 32px;
      font-weight: 700;
      color: var(--gray-900);
      margin-top: 4px;
    }

    .stat-card.highlight {
      background: linear-gradient(135deg, var(--orange-500), var(--orange-600));
      border: none;
    }

    .stat-card.highlight .stat-label { color: rgba(255,255,255,0.8); }
    .stat-card.highlight .stat-value { color: white; }

    /* New Order Form */
    .section-card {
      background: white;
      border-radius: 20px;
      border: 1px solid var(--gray-200);
      padding: 32px;
      margin-bottom: 24px;
    }

    .section-title {
      font-size: 18px;
      font-weight: 700;
      color: var(--gray-900);
      margin-bottom: 24px;
      display: flex; align-items: center; gap: 10px;
    }

    .section-title .icon {
      width: 36px; height: 36px;
      background: var(--orange-50);
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px;
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    @media (max-width: 640px) {
      .form-grid { grid-template-columns: 1fr; }
    }

    .form-group label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: var(--gray-600);
      margin-bottom: 6px;
    }

    .form-group input, .form-group textarea {
      width: 100%;
      padding: 12px 16px;
      border: 2px solid var(--gray-200);
      border-radius: 12px;
      font-size: 14px;
      transition: border-color 0.2s;
      outline: none;
      font-family: inherit;
      background: var(--gray-50);
    }

    .form-group input:focus, .form-group textarea:focus {
      border-color: var(--orange-400);
      background: white;
    }

    .form-group textarea { resize: vertical; min-height: 80px; }

    .form-actions { margin-top: 20px; display: flex; gap: 12px; }

    .btn-primary {
      padding: 12px 28px;
      background: linear-gradient(135deg, var(--orange-500), var(--orange-600));
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.15s, box-shadow 0.15s;
      font-family: inherit;
    }

    .btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(249,115,22,0.35);
    }

    .btn-primary:disabled {
      opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none;
    }

    /* Success toast */
    .toast {
      position: fixed;
      top: 20px;
      right: 20px;
      background: white;
      border-radius: 14px;
      padding: 16px 24px;
      box-shadow: var(--shadow-xl);
      border-left: 4px solid #22c55e;
      display: flex; align-items: center; gap: 12px;
      font-size: 14px;
      font-weight: 500;
      z-index: 100;
      transform: translateX(120%);
      transition: transform 0.4s cubic-bezier(0.16,1,0.3,1);
    }

    .toast.show { transform: translateX(0); }

    .toast .link-copy {
      background: var(--orange-50);
      color: var(--orange-600);
      border: 1px solid var(--orange-200);
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 12px;
      cursor: pointer;
      font-weight: 600;
      font-family: inherit;
      white-space: nowrap;
    }

    .toast .link-copy:hover { background: var(--orange-100); }

    /* Orders Table */
    .orders-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
    }

    .orders-table th {
      text-align: left;
      padding: 12px 16px;
      font-size: 11px;
      font-weight: 600;
      color: var(--gray-400);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid var(--gray-200);
    }

    .orders-table td {
      padding: 16px;
      font-size: 14px;
      border-bottom: 1px solid var(--gray-100);
      vertical-align: middle;
    }

    .orders-table tr:hover td { background: var(--gray-50); }

    .order-name { font-weight: 600; color: var(--gray-900); }

    .order-id {
      font-family: 'SF Mono', 'Fira Code', monospace;
      font-size: 12px;
      color: var(--orange-600);
      background: var(--orange-50);
      padding: 3px 8px;
      border-radius: 6px;
      font-weight: 600;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }

    .status-badge.processing { background: #fef3c7; color: #92400e; }
    .status-badge.transit { background: #dbeafe; color: #1e40af; }
    .status-badge.delivered { background: #dcfce7; color: #166534; }

    .status-dot {
      width: 6px; height: 6px;
      border-radius: 50%;
    }

    .status-badge.processing .status-dot { background: #f59e0b; }
    .status-badge.transit .status-dot { background: #3b82f6; }
    .status-badge.delivered .status-dot { background: #22c55e; }

    .btn-icon {
      width: 36px; height: 36px;
      border-radius: 10px;
      border: 1px solid var(--gray-200);
      background: white;
      cursor: pointer;
      display: inline-flex;
      align-items: center; justify-content: center;
      font-size: 14px;
      transition: all 0.15s;
      color: var(--gray-500);
    }

    .btn-icon:hover { background: var(--gray-100); color: var(--gray-700); }
    .btn-icon.danger:hover { background: #fef2f2; color: #ef4444; border-color: #fecaca; }

    .actions-cell { display: flex; gap: 8px; }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: var(--gray-400);
    }

    .empty-state .icon { font-size: 48px; margin-bottom: 16px; }
    .empty-state p { font-size: 15px; }

    .loading-spinner {
      display: inline-block;
      width: 18px; height: 18px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    .order-address {
      font-size: 12px;
      color: var(--gray-400);
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .delivery-date {
      font-size: 13px;
      color: var(--gray-500);
      font-weight: 500;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .header { padding: 0 16px; }
      .main { padding: 20px 16px; }
      .section-card { padding: 24px 20px; }
      .orders-table { display: block; overflow-x: auto; }
      .header-badge { display: none; }
    }
  </style>
</head>
<body>

  <!-- Login -->
  <div class="login-overlay" id="loginOverlay">
    <div class="login-card">
      <div class="logo-text">IZZAT<span>.</span></div>
      <div class="subtitle">Painel de Rastreio</div>
      <input type="password" id="loginPassword" placeholder="Digite a senha de acesso" onkeydown="if(event.key==='Enter')doLogin()">
      <button onclick="doLogin()">Entrar</button>
      <div class="login-error" id="loginError">Senha incorreta. Tente novamente.</div>
    </div>
  </div>

  <!-- Header -->
  <header class="header">
    <div style="display:flex;align-items:center;">
      <div class="header-logo">IZZAT<span>.</span></div>
      <span class="header-badge">Rastreio</span>
    </div>
    <div class="header-right">
      <button class="btn-logout" onclick="doLogout()">Sair</button>
    </div>
  </header>

  <!-- Main -->
  <main class="main">
    <!-- Stats -->
    <div class="stats-grid">
      <div class="stat-card highlight">
        <div class="stat-label">Total de Pedidos</div>
        <div class="stat-value" id="statTotal">0</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Em Trânsito</div>
        <div class="stat-value" id="statTransit">0</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Entregues</div>
        <div class="stat-value" id="statDelivered">0</div>
      </div>
    </div>

    <!-- New Order -->
    <div class="section-card">
      <div class="section-title">
        <div class="icon">+</div>
        Novo Pedido
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label>Nome do Cliente</label>
          <input type="text" id="inputNome" placeholder="Ex: Maria Silva">
        </div>
        <div class="form-group">
          <label>Endereço Completo</label>
          <input type="text" id="inputEndereco" placeholder="Rua, número, bairro, cidade - UF">
        </div>
      </div>
      <div class="form-actions">
        <button class="btn-primary" id="btnCreate" onclick="createOrder()">
          Criar Rastreio
        </button>
      </div>
    </div>

    <!-- Orders List -->
    <div class="section-card">
      <div class="section-title">
        <div class="icon">📋</div>
        Pedidos
      </div>
      <div id="ordersContainer">
        <div class="empty-state">
          <div class="icon">📦</div>
          <p>Nenhum pedido cadastrado ainda.</p>
        </div>
      </div>
    </div>
  </main>

  <!-- Toast -->
  <div class="toast" id="toast">
    <span id="toastText">Rastreio criado!</span>
    <button class="link-copy" id="toastCopy" onclick="copyToastLink()">Copiar Link</button>
  </div>

  <script>
    let password = "";
    let lastCreatedUrl = "";

    function doLogin() {
      password = document.getElementById("loginPassword").value;
      fetch("/api/orders", {
        headers: { "Authorization": "Bearer " + password }
      })
        .then(r => {
          if (r.ok) {
            document.getElementById("loginOverlay").classList.add("hidden");
            loadOrders();
          } else {
            document.getElementById("loginError").style.display = "block";
          }
        });
    }

    function doLogout() {
      password = "";
      document.getElementById("loginOverlay").classList.remove("hidden");
      document.getElementById("loginPassword").value = "";
      document.getElementById("loginError").style.display = "none";
    }

    async function createOrder() {
      const nome = document.getElementById("inputNome").value.trim();
      const endereco = document.getElementById("inputEndereco").value.trim();
      if (!nome || !endereco) return alert("Preencha todos os campos.");

      const btn = document.getElementById("btnCreate");
      btn.disabled = true;
      btn.innerHTML = '<span class="loading-spinner"></span>';

      try {
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + password
          },
          body: JSON.stringify({ nome, endereco })
        });

        const data = await res.json();

        if (data.success) {
          document.getElementById("inputNome").value = "";
          document.getElementById("inputEndereco").value = "";
          lastCreatedUrl = data.trackingUrl;
          showToast("Rastreio " + data.order.id + " criado!");
          loadOrders();
        }
      } catch (e) {
        alert("Erro ao criar pedido.");
      }

      btn.disabled = false;
      btn.textContent = "Criar Rastreio";
    }

    function showToast(text) {
      const t = document.getElementById("toast");
      document.getElementById("toastText").textContent = text;
      t.classList.add("show");
      setTimeout(() => t.classList.remove("show"), 5000);
    }

    function copyToastLink() {
      navigator.clipboard.writeText(lastCreatedUrl);
      document.getElementById("toastCopy").textContent = "Copiado!";
      setTimeout(() => document.getElementById("toastCopy").textContent = "Copiar Link", 2000);
    }

    function getStatusClass(status) {
      if (status === "Pedido entregue") return "delivered";
      if (status === "Pedido processado" || status === "Em preparação") return "processing";
      return "transit";
    }

    async function loadOrders() {
      try {
        const res = await fetch("/api/orders", {
          headers: { "Authorization": "Bearer " + password }
        });
        const data = await res.json();

        const container = document.getElementById("ordersContainer");

        if (!data.orders || data.orders.length === 0) {
          container.innerHTML = '<div class="empty-state"><div class="icon">📦</div><p>Nenhum pedido cadastrado ainda.</p></div>';
          document.getElementById("statTotal").textContent = "0";
          document.getElementById("statTransit").textContent = "0";
          document.getElementById("statDelivered").textContent = "0";
          return;
        }

        let transit = 0, delivered = 0;
        data.orders.forEach(o => {
          if (o.currentStatus === "Pedido entregue") delivered++;
          else transit++;
        });

        document.getElementById("statTotal").textContent = data.orders.length;
        document.getElementById("statTransit").textContent = transit;
        document.getElementById("statDelivered").textContent = delivered;

        let html = '<table class="orders-table"><thead><tr>';
        html += '<th>Código</th><th>Cliente</th><th>Status</th><th>Previsão</th><th>Ações</th>';
        html += '</tr></thead><tbody>';

        data.orders.forEach(order => {
          const sc = getStatusClass(order.currentStatus);
          html += '<tr>';
          html += '<td><span class="order-id">' + order.id + '</span></td>';
          html += '<td><div class="order-name">' + order.nome + '</div><div class="order-address">' + order.endereco + '</div></td>';
          html += '<td><span class="status-badge ' + sc + '"><span class="status-dot"></span>' + order.currentStatus + '</span></td>';
          html += '<td><span class="delivery-date">' + order.estimatedDelivery + '</span></td>';
          html += '<td><div class="actions-cell">';
          html += '<button class="btn-icon" title="Copiar Link" onclick="copyLink(\\''+order.trackingUrl+'\\')">🔗</button>';
          html += '<button class="btn-icon danger" title="Excluir" onclick="deleteOrder(\\''+order.id+'\\')">🗑️</button>';
          html += '</div></td>';
          html += '</tr>';
        });

        html += '</tbody></table>';
        container.innerHTML = html;
      } catch (e) {
        console.error(e);
      }
    }

    function copyLink(url) {
      navigator.clipboard.writeText(url);
      showToast("Link copiado!");
    }

    async function deleteOrder(id) {
      if (!confirm("Tem certeza que deseja excluir este rastreio?")) return;

      await fetch("/api/orders/" + id, {
        method: "DELETE",
        headers: { "Authorization": "Bearer " + password }
      });

      loadOrders();
      showToast("Rastreio excluído.");
    }
  </script>
</body>
</html>`;
}

// ============================================================
// Customer Tracking Page HTML
// ============================================================
function getTrackingHTML(trackingId) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Izzat - Rastreio do Pedido</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    :root {
      --orange-50: #fff7ed;
      --orange-100: #ffedd5;
      --orange-200: #fed7aa;
      --orange-300: #fdba74;
      --orange-400: #fb923c;
      --orange-500: #f97316;
      --orange-600: #ea580c;
      --orange-700: #c2410c;
      --gray-50: #f9fafb;
      --gray-100: #f3f4f6;
      --gray-200: #e5e7eb;
      --gray-300: #d1d5db;
      --gray-400: #9ca3af;
      --gray-500: #6b7280;
      --gray-600: #4b5563;
      --gray-700: #374151;
      --gray-800: #1f2937;
      --gray-900: #111827;
    }

    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background: var(--gray-50);
      color: var(--gray-800);
      min-height: 100vh;
    }

    /* Header */
    .track-header {
      background: linear-gradient(135deg, var(--orange-500) 0%, var(--orange-700) 100%);
      padding: 40px 24px 80px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }

    .track-header::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 60%);
    }

    .track-header .logo {
      font-size: 32px;
      font-weight: 800;
      color: white;
      letter-spacing: -1px;
      position: relative;
    }

    .track-header .logo span { opacity: 0.7; }

    .track-header h2 {
      font-size: 15px;
      color: rgba(255,255,255,0.85);
      font-weight: 400;
      margin-top: 8px;
      position: relative;
    }

    /* Main card */
    .track-container {
      max-width: 600px;
      margin: -48px auto 40px;
      padding: 0 20px;
      position: relative;
    }

    .track-card {
      background: white;
      border-radius: 24px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.08);
      overflow: hidden;
    }

    .track-info {
      padding: 32px 28px;
      border-bottom: 1px solid var(--gray-100);
    }

    .track-code {
      display: inline-block;
      font-family: 'SF Mono', 'Fira Code', monospace;
      font-size: 13px;
      font-weight: 700;
      color: var(--orange-600);
      background: var(--orange-50);
      padding: 6px 14px;
      border-radius: 8px;
      letter-spacing: 1px;
    }

    .customer-name {
      font-size: 22px;
      font-weight: 700;
      color: var(--gray-900);
      margin-top: 16px;
    }

    .customer-address {
      font-size: 14px;
      color: var(--gray-400);
      margin-top: 6px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .delivery-box {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 28px;
      background: var(--orange-50);
      border-bottom: 1px solid var(--orange-100);
    }

    .delivery-box .label {
      font-size: 12px;
      font-weight: 600;
      color: var(--orange-600);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .delivery-box .date {
      font-size: 18px;
      font-weight: 700;
      color: var(--orange-700);
    }

    .delivery-box .progress-info {
      text-align: right;
    }

    .delivery-box .step-text {
      font-size: 12px;
      color: var(--orange-600);
      font-weight: 500;
    }

    /* Progress bar */
    .progress-bar-container {
      padding: 0 28px;
      margin-top: 4px;
    }

    .progress-bar-bg {
      width: 100%;
      height: 6px;
      background: var(--orange-100);
      border-radius: 3px;
      overflow: hidden;
      margin-top: 8px;
    }

    .progress-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--orange-400), var(--orange-600));
      border-radius: 3px;
      transition: width 1s ease;
    }

    /* Timeline */
    .timeline {
      padding: 28px;
    }

    .timeline-title {
      font-size: 14px;
      font-weight: 700;
      color: var(--gray-900);
      margin-bottom: 24px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .timeline-item {
      display: flex;
      gap: 16px;
      position: relative;
      padding-bottom: 28px;
    }

    .timeline-item:last-child { padding-bottom: 0; }

    .timeline-item::before {
      content: '';
      position: absolute;
      left: 17px;
      top: 36px;
      bottom: 0;
      width: 2px;
      background: var(--gray-200);
    }

    .timeline-item:last-child::before { display: none; }

    .timeline-item.active::before {
      background: linear-gradient(to bottom, var(--orange-400), var(--gray-200));
    }

    .timeline-dot {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--gray-100);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      flex-shrink: 0;
      position: relative;
      z-index: 1;
      border: 3px solid var(--gray-200);
    }

    .timeline-item.active .timeline-dot {
      background: var(--orange-50);
      border-color: var(--orange-400);
      box-shadow: 0 0 0 4px rgba(249,115,22,0.15);
    }

    .timeline-item.completed .timeline-dot {
      background: var(--orange-500);
      border-color: var(--orange-500);
    }

    .timeline-item.completed::before {
      background: var(--orange-400);
    }

    .timeline-content {
      padding-top: 6px;
      flex: 1;
    }

    .timeline-status {
      font-size: 14px;
      font-weight: 600;
      color: var(--gray-900);
    }

    .timeline-item:not(.active):not(.completed) .timeline-status {
      color: var(--gray-300);
    }

    .timeline-desc {
      font-size: 13px;
      color: var(--gray-400);
      margin-top: 2px;
    }

    .timeline-item:not(.active):not(.completed) .timeline-desc {
      color: var(--gray-300);
    }

    .timeline-date {
      font-size: 11px;
      color: var(--gray-400);
      margin-top: 4px;
      font-weight: 500;
    }

    /* Loading & Error */
    .loading-screen {
      text-align: center;
      padding: 80px 20px;
    }

    .loading-screen .spinner {
      width: 40px; height: 40px;
      border: 3px solid var(--orange-100);
      border-top-color: var(--orange-500);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    .loading-screen p {
      margin-top: 16px;
      color: var(--gray-400);
      font-size: 14px;
    }

    .error-screen {
      text-align: center;
      padding: 80px 20px;
    }

    .error-screen .icon { font-size: 48px; margin-bottom: 16px; }

    .error-screen h3 {
      font-size: 18px;
      color: var(--gray-900);
      margin-bottom: 8px;
    }

    .error-screen p {
      color: var(--gray-400);
      font-size: 14px;
    }

    /* Footer */
    .track-footer {
      text-align: center;
      padding: 24px;
      color: var(--gray-300);
      font-size: 12px;
    }

    .track-footer strong { color: var(--gray-500); }

    /* Current status highlight */
    .current-status-box {
      margin: 0 28px;
      padding: 16px 20px;
      background: linear-gradient(135deg, var(--orange-500), var(--orange-600));
      border-radius: 14px;
      color: white;
      display: flex;
      align-items: center;
      gap: 14px;
      margin-top: 24px;
    }

    .current-status-box .emoji {
      font-size: 28px;
      background: rgba(255,255,255,0.2);
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .current-status-box .text .label {
      font-size: 11px;
      opacity: 0.8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 500;
    }

    .current-status-box .text .value {
      font-size: 16px;
      font-weight: 700;
      margin-top: 2px;
    }
  </style>
</head>
<body>

  <div class="track-header">
    <div class="logo">IZZAT<span>.</span></div>
    <h2>Rastreamento de Pedido</h2>
  </div>

  <div class="track-container">
    <div class="track-card" id="trackCard">
      <div class="loading-screen" id="loadingScreen">
        <div class="spinner"></div>
        <p>Carregando rastreio...</p>
      </div>
    </div>

    <div class="track-footer">
      Powered by <strong>Izzat Express</strong>
    </div>
  </div>

  <script>
    const TRACKING_ID = "${trackingId}";

    const ALL_STATUSES = [
      { status: "Pedido processado", description: "Seu pedido foi recebido e está sendo processado.", icon: "📦" },
      { status: "Em preparação", description: "Seu pedido está sendo preparado para envio.", icon: "🔧" },
      { status: "Pedido despachado", description: "Seu pedido foi despachado do nosso centro.", icon: "📤" },
      { status: "Pedido recebido pela transportadora", description: "A transportadora recebeu seu pedido.", icon: "🚚" },
      { status: "Em trânsito para o centro de distribuição", description: "Seu pedido está a caminho do centro de distribuição da sua região.", icon: "🛣️" },
      { status: "Pedido no centro de distribuição", description: "Seu pedido chegou ao centro de distribuição mais próximo.", icon: "🏭" },
      { status: "Pedido saiu para entrega", description: "Seu pedido está a caminho! Aguarde o entregador.", icon: "🏍️" },
      { status: "Pedido entregue", description: "Seu pedido foi entregue com sucesso!", icon: "✅" }
    ];

    async function loadTracking() {
      try {
        const res = await fetch("/api/tracking/" + TRACKING_ID);

        if (!res.ok) {
          document.getElementById("trackCard").innerHTML =
            '<div class="error-screen"><div class="icon">🔍</div><h3>Pedido não encontrado</h3><p>Verifique o código de rastreio e tente novamente.</p></div>';
          return;
        }

        const data = await res.json();
        renderTracking(data);
      } catch (e) {
        document.getElementById("trackCard").innerHTML =
          '<div class="error-screen"><div class="icon">⚠️</div><h3>Erro de conexão</h3><p>Não foi possível carregar o rastreio. Tente novamente.</p></div>';
      }
    }

    function renderTracking(data) {
      const currentIdx = data.currentStep - 1;
      const progress = Math.round((data.currentStep / data.totalSteps) * 100);
      const currentItem = data.history[data.history.length - 1];

      let html = '';

      // Customer info
      html += '<div class="track-info">';
      html += '<span class="track-code">' + data.id + '</span>';
      html += '<div class="customer-name">' + data.nome + '</div>';
      html += '<div class="customer-address">📍 ' + data.endereco + '</div>';
      html += '</div>';

      // Delivery estimate
      html += '<div class="delivery-box">';
      html += '<div><div class="label">Prazo máximo de entrega</div><div class="date">' + data.estimatedDelivery + '</div></div>';
      html += '<div class="progress-info"><div class="step-text">Etapa ' + data.currentStep + ' de ' + data.totalSteps + '</div></div>';
      html += '</div>';

      // Progress bar
      html += '<div class="progress-bar-container"><div class="progress-bar-bg"><div class="progress-bar-fill" style="width:' + progress + '%"></div></div></div>';

      // Current status
      html += '<div class="current-status-box">';
      html += '<div class="emoji">' + currentItem.icon + '</div>';
      html += '<div class="text"><div class="label">Status atual</div><div class="value">' + currentItem.status + '</div></div>';
      html += '</div>';

      // Timeline
      html += '<div class="timeline"><div class="timeline-title">Histórico de Atualizações</div>';

      // Show completed items reversed (most recent first)
      const reversed = [...data.history].reverse();
      reversed.forEach((item, idx) => {
        const isActive = idx === 0;
        const cls = isActive ? 'active' : 'completed';
        html += '<div class="timeline-item ' + cls + '">';
        html += '<div class="timeline-dot">' + (cls === 'completed' ? '✓' : item.icon) + '</div>';
        html += '<div class="timeline-content">';
        html += '<div class="timeline-status">' + item.status + '</div>';
        html += '<div class="timeline-desc">' + item.description + '</div>';
        html += '<div class="timeline-date">' + item.date + '</div>';
        html += '</div></div>';
      });

      // Show remaining (future) steps
      for (let i = currentIdx + 1; i < ALL_STATUSES.length; i++) {
        html += '<div class="timeline-item">';
        html += '<div class="timeline-dot">' + ALL_STATUSES[i].icon + '</div>';
        html += '<div class="timeline-content">';
        html += '<div class="timeline-status">' + ALL_STATUSES[i].status + '</div>';
        html += '<div class="timeline-desc">' + ALL_STATUSES[i].description + '</div>';
        html += '</div></div>';
      }

      html += '</div>';

      document.getElementById("trackCard").innerHTML = html;
    }

    loadTracking();
  </script>
</body>
</html>`;
}
