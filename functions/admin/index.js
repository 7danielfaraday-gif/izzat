import { checkBasicAuth, unauthorized } from '../_shared/auth.js';

function htmlResponse(body, status = 200) {
  return new Response(body, {
    status,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store, max-age=0',
    },
  });
}

function renderAdminShell() {
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Izzat Admin</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;700;800&display=swap" rel="stylesheet" />
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['Manrope', 'system-ui', 'sans-serif']
          },
          boxShadow: {
            panel: '0 18px 60px rgba(15, 23, 42, 0.24)'
          }
        }
      }
    };
  </script>
</head>
<body class="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
  <div class="min-h-screen lg:grid lg:grid-cols-[280px,minmax(0,1fr)]">
    <aside class="hidden border-r border-white/10 bg-slate-950/90 p-6 lg:flex lg:flex-col">
      <div>
        <div class="text-[11px] font-bold uppercase tracking-[0.35em] text-emerald-300/80">Izzat Admin</div>
        <div class="mt-3 text-3xl font-extrabold text-white">Produtos por campanha</div>
        <p class="mt-3 text-sm leading-6 text-slate-400">
          Cadastre LP, checkout, PIX, pixel e CAPI por produto sem duplicar arquivos.
        </p>
      </div>

      <nav class="mt-10 space-y-2">
        <button type="button" data-section="dashboard" class="nav-button w-full rounded-2xl border border-emerald-500/30 bg-emerald-500/15 px-4 py-3 text-left text-sm font-semibold text-emerald-200">Dashboard</button>
        <button type="button" data-section="orders" class="nav-button w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm font-semibold text-slate-300">Pedidos</button>
        <button type="button" data-section="products" class="nav-button w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm font-semibold text-slate-300">Produtos</button>
      </nav>

      <div class="mt-auto rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4 shadow-panel">
        <div class="text-xs font-bold uppercase tracking-[0.25em] text-emerald-200/80">Fluxo novo</div>
        <ul class="mt-3 space-y-2 text-sm text-slate-200/90">
          <li>Upload de imagens no painel</li>
          <li>Foto dedicada para o checkout</li>
          <li>Avaliações editáveis e importáveis</li>
          <li>Pixel e CAPI separados por produto</li>
        </ul>
      </div>
    </aside>

    <main class="min-w-0">
      <header class="sticky top-0 z-30 border-b border-white/10 bg-slate-950/85 backdrop-blur">
        <div class="flex flex-wrap items-center justify-between gap-4 px-4 py-4 lg:px-8">
          <div>
            <div class="text-lg font-extrabold text-white">Painel administrativo</div>
            <div class="text-sm text-slate-400">Cadastro completo de produtos, LPs e checkouts</div>
          </div>
          <div class="flex flex-wrap gap-2">
            <button id="refreshData" type="button" class="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-white/10">Recarregar</button>
            <button id="saveProducts" type="button" class="rounded-2xl bg-emerald-400 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-300">Salvar produtos</button>
          </div>
        </div>

        <div class="border-t border-white/10 px-4 py-3 lg:hidden">
          <div class="flex gap-2 overflow-x-auto pb-1">
            <button type="button" data-section="dashboard" class="nav-button shrink-0 rounded-2xl border border-emerald-500/30 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-200">Dashboard</button>
            <button type="button" data-section="orders" class="nav-button shrink-0 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-300">Pedidos</button>
            <button type="button" data-section="products" class="nav-button shrink-0 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-300">Produtos</button>
          </div>
        </div>
      </header>

      <div class="px-4 py-6 lg:px-8">
        <div id="statusMsg" class="mb-5 text-sm font-semibold text-slate-400">Carregando painel...</div>

        <section id="section-dashboard" class="admin-section">
          <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <div class="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-panel">
              <div class="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">Online agora</div>
              <div id="onlineNow" class="mt-3 text-3xl font-extrabold text-white">0</div>
            </div>
            <div class="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-panel">
              <div class="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">Copias PIX</div>
              <div id="pixClicks" class="mt-3 text-3xl font-extrabold text-emerald-300">0</div>
            </div>
            <div class="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-panel">
              <div class="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">Pedidos hoje</div>
              <div id="ordersToday" class="mt-3 text-3xl font-extrabold text-white">0</div>
            </div>
            <div class="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-panel">
              <div class="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">Pedidos totais</div>
              <div id="ordersTotal" class="mt-3 text-3xl font-extrabold text-white">0</div>
            </div>
            <div class="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-panel">
              <div class="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">Produtos ativos</div>
              <div id="productsActive" class="mt-3 text-3xl font-extrabold text-amber-300">0</div>
            </div>
          </div>
        </section>

        <section id="section-orders" class="admin-section hidden mt-6">
          <div class="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-panel">
            <div class="border-b border-white/10 px-5 py-4">
              <div class="text-lg font-bold text-white">Pedidos recebidos</div>
              <div class="text-sm text-slate-400">Todos os pedidos com produto, contato e valor.</div>
            </div>
            <div id="ordersBody" class="overflow-x-auto"></div>
          </div>
        </section>

        <section id="section-products" class="admin-section hidden mt-6">
          <div class="grid gap-6 xl:grid-cols-[320px,minmax(0,1fr)]">
            <aside class="space-y-4">
              <div class="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-panel">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <div class="text-lg font-extrabold text-white">Produtos</div>
                    <div class="text-sm text-slate-400">Escolha um produto para editar</div>
                  </div>
                  <button id="newProduct" type="button" class="rounded-2xl bg-white/10 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/15">Novo</button>
                </div>

                <div id="productList" class="mt-4 space-y-2"></div>

                <div class="mt-4 grid grid-cols-2 gap-2">
                  <button id="duplicateProduct" type="button" class="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-200 transition hover:bg-white/10">Duplicar</button>
                  <button id="removeProduct" type="button" class="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-100 transition hover:bg-rose-500/20">Remover</button>
                </div>
              </div>

              <div class="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-panel">
                <div class="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">Dica</div>
                <p class="mt-3 text-sm leading-6 text-slate-300">
                  As imagens enviadas aqui passam por compressao automatica para caber melhor no painel e no checkout.
                </p>
              </div>
            </aside>

            <div class="space-y-5">
              <div class="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-panel">
                <div class="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div class="text-xs font-bold uppercase tracking-[0.25em] text-emerald-300/80">Produto selecionado</div>
                    <div id="productHeading" class="mt-2 text-2xl font-extrabold text-white">Carregando...</div>
                    <div id="productSubheading" class="mt-1 text-sm text-slate-400"></div>
                  </div>
                  <div class="flex flex-wrap gap-2">
                    <button id="openLanding" type="button" class="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/10">Abrir LP</button>
                    <button id="openCheckout" type="button" class="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/10">Abrir checkout</button>
                  </div>
                </div>

                <div id="productSummary" class="mt-5"></div>
              </div>

              <div class="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-panel">
                <div id="productTabs" class="flex flex-wrap gap-2"></div>
                <div id="productEditor" class="mt-5"></div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  </div>

  <div id="reviewImportModal" class="fixed inset-0 z-50 hidden items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
    <div class="w-full max-w-3xl rounded-3xl border border-white/10 bg-slate-900 p-5 shadow-panel">
      <div class="flex items-start justify-between gap-4">
        <div>
          <div id="reviewImportTitle" class="text-lg font-extrabold text-white">Importar avaliacoes</div>
          <p class="mt-1 text-sm text-slate-400">Cole um JSON com array de avaliacoes para adicionar ou substituir a lista.</p>
        </div>
        <button id="closeReviewImport" type="button" class="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10">Fechar</button>
      </div>

      <div class="mt-5 grid gap-4 md:grid-cols-2">
        <label class="text-sm">
          <span class="mb-2 block font-semibold text-slate-300">Lista de destino</span>
          <select id="reviewImportTarget" class="w-full rounded-2xl border border-white/10 bg-slate-950 px-3 py-3 text-white outline-none">
            <option value="visible_reviews">Avaliacoes visiveis</option>
            <option value="extra_reviews">Avaliacoes extras</option>
          </select>
        </label>
        <label class="text-sm">
          <span class="mb-2 block font-semibold text-slate-300">Modo da importacao</span>
          <select id="reviewImportMode" class="w-full rounded-2xl border border-white/10 bg-slate-950 px-3 py-3 text-white outline-none">
            <option value="append">Adicionar ao final</option>
            <option value="replace">Substituir a lista atual</option>
          </select>
        </label>
      </div>

      <label class="mt-4 block text-sm">
        <span class="mb-2 block font-semibold text-slate-300">JSON das avaliacoes</span>
        <textarea id="reviewImportText" rows="16" class="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 font-mono text-xs text-white outline-none" placeholder='[{"name":"Cliente","rating":5,"comment":"Muito bom"}]'></textarea>
      </label>

      <div class="mt-4 flex flex-wrap justify-end gap-2">
        <button id="submitReviewImport" type="button" class="rounded-2xl bg-emerald-400 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-300">Importar avaliacoes</button>
      </div>
    </div>
  </div>

  <input id="assetPicker" type="file" accept="image/*" class="hidden" />

  <script defer src="/assets/js/admin.app.js"></script>
</body>
</html>`;
}

export async function onRequestGet(context) {
  if (!checkBasicAuth(context.request, context.env)) return unauthorized('Izzat Admin');
  return htmlResponse(renderAdminShell());
}
