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
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] }
        }
      }
    };
  </script>
</head>
<body class="min-h-screen bg-slate-950 text-slate-100 font-sans">
  <div class="flex min-h-screen">
    <aside class="hidden w-72 border-r border-white/10 bg-slate-950/90 p-6 lg:flex lg:flex-col">
      <div>
        <div class="text-2xl font-extrabold text-white">Izzat</div>
        <div class="mt-1 text-sm text-slate-500">Painel de produtos, PIX e tracking</div>
      </div>
      <nav class="mt-8 flex flex-col gap-2">
        <button type="button" data-section="dashboard" class="rounded-2xl border border-emerald-500/30 bg-emerald-500/15 px-4 py-3 text-left text-sm font-semibold text-emerald-300">Dashboard</button>
        <button type="button" data-section="orders" class="rounded-2xl border border-white/10 px-4 py-3 text-left text-sm font-semibold text-slate-300">Pedidos</button>
        <button type="button" data-section="products" class="rounded-2xl border border-white/10 px-4 py-3 text-left text-sm font-semibold text-slate-300">Produtos</button>
      </nav>
      <div class="mt-auto rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-400">
        Cada produto pode ter LP, checkout, PIX e tracking independentes.
      </div>
    </aside>

    <main class="flex-1">
      <header class="sticky top-0 z-20 border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <div class="flex flex-wrap items-center justify-between gap-3 px-4 py-4 lg:px-8">
          <div>
            <div class="text-lg font-bold text-white">Painel administrativo</div>
            <div class="text-sm text-slate-500">Cadastro completo de produtos e paginas de vendas</div>
          </div>
          <div class="flex items-center gap-2">
            <button id="refreshData" type="button" class="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10">Recarregar</button>
            <button id="saveProducts" type="button" class="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400">Salvar produtos</button>
          </div>
        </div>
      </header>

      <div class="px-4 py-6 lg:px-8">
        <div id="statusMsg" class="mb-4 text-xs font-semibold text-slate-400">Carregando painel...</div>

        <section id="section-dashboard" class="admin-section">
          <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <div class="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div class="text-xs uppercase tracking-[0.2em] text-slate-500">Online agora</div>
              <div id="onlineNow" class="mt-3 text-3xl font-extrabold text-white">0</div>
            </div>
            <div class="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div class="text-xs uppercase tracking-[0.2em] text-slate-500">Copias PIX</div>
              <div id="pixClicks" class="mt-3 text-3xl font-extrabold text-emerald-300">0</div>
            </div>
            <div class="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div class="text-xs uppercase tracking-[0.2em] text-slate-500">Pedidos hoje</div>
              <div id="ordersToday" class="mt-3 text-3xl font-extrabold text-white">0</div>
            </div>
            <div class="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div class="text-xs uppercase tracking-[0.2em] text-slate-500">Pedidos totais</div>
              <div id="ordersTotal" class="mt-3 text-3xl font-extrabold text-white">0</div>
            </div>
            <div class="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div class="text-xs uppercase tracking-[0.2em] text-slate-500">Produtos ativos</div>
              <div id="productsActive" class="mt-3 text-3xl font-extrabold text-amber-300">0</div>
            </div>
          </div>
        </section>

        <section id="section-orders" class="admin-section hidden mt-6">
          <div class="rounded-3xl border border-white/10 bg-white/5">
            <div class="border-b border-white/10 px-5 py-4">
              <div class="text-base font-bold text-white">Pedidos recebidos</div>
            </div>
            <div id="ordersBody" class="overflow-x-auto"></div>
          </div>
        </section>

        <section id="section-products" class="admin-section hidden mt-6">
          <div class="grid gap-6 xl:grid-cols-[320px,minmax(0,1fr)]">
            <div class="space-y-4">
              <div class="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div class="flex items-center justify-between gap-2">
                  <div>
                    <div class="text-base font-bold text-white">Produtos</div>
                    <div class="text-xs text-slate-500">Selecione para editar</div>
                  </div>
                  <button id="newProduct" type="button" class="rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/15">Novo</button>
                </div>
                <div id="productList" class="mt-4 space-y-2"></div>
                <div class="mt-4 grid grid-cols-2 gap-2">
                  <button id="duplicateProduct" type="button" class="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10">Duplicar</button>
                  <button id="removeProduct" type="button" class="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-200 hover:bg-rose-500/15">Remover</button>
                </div>
              </div>
            </div>

            <div class="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div class="text-base font-bold text-white">Configuracao do produto</div>
                  <div class="text-xs text-slate-500">Edite LP, checkout, PIX e tracking no mesmo lugar</div>
                </div>
                <div class="flex flex-wrap gap-2">
                  <button id="openLanding" type="button" class="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10">Abrir LP</button>
                  <button id="openCheckout" type="button" class="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10">Abrir checkout</button>
                </div>
              </div>

              <div class="mt-6 grid gap-6 xl:grid-cols-2">
                <div class="space-y-5">
                  <div class="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <div class="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Basico</div>
                    <div class="grid gap-3">
                      <label class="text-sm">
                        <span class="mb-1 block text-slate-400">Titulo</span>
                        <input id="fieldTitle" class="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none" />
                      </label>
                      <label class="text-sm">
                        <span class="mb-1 block text-slate-400">Slug</span>
                        <input id="fieldSlug" class="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none" />
                      </label>
                      <div class="grid gap-3 sm:grid-cols-2">
                        <label class="text-sm">
                          <span class="mb-1 block text-slate-400">Categoria</span>
                          <input id="fieldCategory" class="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none" />
                        </label>
                        <label class="text-sm">
                          <span class="mb-1 block text-slate-400">Variante</span>
                          <input id="fieldVariantLabel" class="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none" />
                        </label>
                      </div>
                      <label class="text-sm">
                        <span class="mb-1 block text-slate-400">Descricao curta da LP</span>
                        <textarea id="fieldShortDescription" rows="3" class="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none"></textarea>
                      </label>
                      <label class="text-sm">
                        <span class="mb-1 block text-slate-400">Descricao SEO / meta</span>
                        <textarea id="fieldSeoDescription" rows="3" class="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none"></textarea>
                      </label>
                      <div class="grid gap-3 sm:grid-cols-2">
                        <label class="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-slate-200">
                          <input id="fieldActive" type="checkbox" class="h-4 w-4 accent-emerald-400" />
                          Produto ativo
                        </label>
                        <label class="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-slate-200">
                          <input id="fieldDefault" type="checkbox" class="h-4 w-4 accent-emerald-400" />
                          Produto padrao da home
                        </label>
                      </div>
                      <div class="grid gap-2 rounded-2xl border border-white/10 bg-slate-900/50 p-3 text-xs text-slate-400">
                        <div>LP: <span id="previewLanding" class="text-slate-200"></span></div>
                        <div>Checkout: <span id="previewCheckout" class="text-slate-200"></span></div>
                      </div>
                    </div>
                  </div>

                  <div class="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <div class="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Precos e prova social</div>
                    <div class="grid gap-3 sm:grid-cols-3">
                      <label class="text-sm"><span class="mb-1 block text-slate-400">Preco LP cheio</span><input id="fieldPriceOriginal" type="number" step="0.01" class="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none" /></label>
                      <label class="text-sm"><span class="mb-1 block text-slate-400">Preco LP oferta</span><input id="fieldPriceLanding" type="number" step="0.01" class="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none" /></label>
                      <label class="text-sm"><span class="mb-1 block text-slate-400">Preco checkout</span><input id="fieldPriceCheckout" type="number" step="0.01" class="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none" /></label>
                    </div>
                    <div class="mt-3 grid gap-3 sm:grid-cols-2">
                      <label class="text-sm"><span class="mb-1 block text-slate-400">Badge de desconto</span><input id="fieldDiscountBadge" class="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none" /></label>
                      <label class="text-sm"><span class="mb-1 block text-slate-400">Texto de economia</span><input id="fieldDiscountText" class="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none" /></label>
                    </div>
                    <div class="mt-3 grid gap-3 sm:grid-cols-4">
                      <label class="text-sm"><span class="mb-1 block text-slate-400">Nota</span><input id="fieldRatingValue" type="number" step="0.1" class="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none" /></label>
                      <label class="text-sm"><span class="mb-1 block text-slate-400">Qtd. notas</span><input id="fieldRatingCount" type="number" class="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none" /></label>
                      <label class="text-sm"><span class="mb-1 block text-slate-400">Vendidos</span><input id="fieldSoldCount" type="number" class="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none" /></label>
                      <label class="text-sm"><span class="mb-1 block text-slate-400">Qtd. avaliacoes</span><input id="fieldReviewCount" type="number" class="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none" /></label>
                    </div>
                    <label class="mt-3 block text-sm">
                      <span class="mb-1 block text-slate-400">Resumo de estrelas (JSON)</span>
                      <textarea id="fieldRatingBreakdown" rows="8" class="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 font-mono text-xs text-white outline-none"></textarea>
                    </label>
                  </div>

                  <div class="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <div class="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Midia e avaliacoes</div>
                    <label class="block text-sm">
                      <span class="mb-1 block text-slate-400">Fotos do produto (1 URL/caminho por linha)</span>
                      <textarea id="fieldImages" rows="8" class="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 font-mono text-xs text-white outline-none"></textarea>
                    </label>
                    <label class="mt-3 block text-sm">
                      <span class="mb-1 block text-slate-400">Avaliacoes visiveis (JSON)</span>
                      <textarea id="fieldVisibleReviews" rows="12" class="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 font-mono text-xs text-white outline-none"></textarea>
                    </label>
                    <label class="mt-3 block text-sm">
                      <span class="mb-1 block text-slate-400">Avaliacoes extras (JSON)</span>
                      <textarea id="fieldExtraReviews" rows="12" class="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 font-mono text-xs text-white outline-none"></textarea>
                    </label>
                  </div>
                </div>

                <div class="space-y-5">
                  <div class="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <div class="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Descricao da LP</div>
                    <label class="block text-sm"><span class="mb-1 block text-slate-400">Titulo da secao</span><input id="fieldDescriptionHeading" class="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none" /></label>
                    <label class="mt-3 block text-sm"><span class="mb-1 block text-slate-400">Texto principal</span><textarea id="fieldDescriptionText" rows="5" class="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none"></textarea></label>
                    <label class="mt-3 block text-sm"><span class="mb-1 block text-slate-400">Bullets da descricao (JSON)</span><textarea id="fieldDescriptionBullets" rows="12" class="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 font-mono text-xs text-white outline-none"></textarea></label>
                    <div class="mt-3 grid gap-3 sm:grid-cols-2">
                      <label class="text-sm"><span class="mb-1 block text-slate-400">Titulo da caixa final</span><input id="fieldInfoTitle" class="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none" /></label>
                      <label class="text-sm"><span class="mb-1 block text-slate-400">Texto da caixa final</span><textarea id="fieldInfoText" rows="4" class="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none"></textarea></label>
                    </div>
                  </div>

                  <div class="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <div class="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Checkout</div>
                    <div class="grid gap-3 sm:grid-cols-2">
                      <label class="text-sm"><span class="mb-1 block text-slate-400">Badge da oferta</span><input id="fieldOfferBadge" class="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none" /></label>
                      <label class="text-sm"><span class="mb-1 block text-slate-400">Texto do botao</span><input id="fieldSubmitLabel" class="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none" /></label>
                    </div>
                    <div class="mt-3 grid gap-3 sm:grid-cols-2">
                      <label class="text-sm"><span class="mb-1 block text-slate-400">Titulo garantia</span><input id="fieldGuaranteeTitle" class="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none" /></label>
                      <label class="text-sm"><span class="mb-1 block text-slate-400">Texto garantia</span><textarea id="fieldGuaranteeText" rows="4" class="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none"></textarea></label>
                    </div>
                    <div class="mt-3 grid gap-3 sm:grid-cols-2">
                      <label class="text-sm"><span class="mb-1 block text-slate-400">Titulo sucesso</span><input id="fieldSuccessTitle" class="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none" /></label>
                      <label class="text-sm"><span class="mb-1 block text-slate-400">Subtitulo sucesso</span><textarea id="fieldSuccessSubtitle" rows="4" class="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none"></textarea></label>
                    </div>
                    <div class="mt-3 grid gap-3 sm:grid-cols-2">
                      <label class="text-sm"><span class="mb-1 block text-slate-400">Nome do pagamento</span><input id="fieldPaymentLabel" class="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none" /></label>
                      <label class="text-sm"><span class="mb-1 block text-slate-400">Badge do pagamento</span><input id="fieldPaymentBadge" class="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none" /></label>
                    </div>
                    <label class="mt-3 block text-sm"><span class="mb-1 block text-slate-400">Passos do pagamento (JSON)</span><textarea id="fieldPaymentInstructions" rows="10" class="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 font-mono text-xs text-white outline-none"></textarea></label>
                    <div class="mt-3 grid gap-3 sm:grid-cols-2">
                      <label class="text-sm"><span class="mb-1 block text-slate-400">Rodape linha 1</span><input id="fieldFooterPrimary" class="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none" /></label>
                      <label class="text-sm"><span class="mb-1 block text-slate-400">Rodape linha 2</span><input id="fieldFooterSecondary" class="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none" /></label>
                    </div>
                  </div>

                  <div class="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <div class="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">PIX e tracking</div>
                    <label class="block text-sm"><span class="mb-1 block text-slate-400">PIX copia e cola</span><textarea id="fieldPixCode" rows="6" class="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 font-mono text-xs text-white outline-none"></textarea></label>
                    <div class="mt-3 grid gap-3 sm:grid-cols-2">
                      <label class="text-sm"><span class="mb-1 block text-slate-400">QR Code (URL/caminho)</span><input id="fieldQrUrl" class="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none" /></label>
                      <label class="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-slate-200"><input id="fieldDisableQr" type="checkbox" class="h-4 w-4 accent-emerald-400" />Ocultar QR code</label>
                    </div>
                    <div class="mt-4 grid gap-3 sm:grid-cols-2">
                      <label class="text-sm"><span class="mb-1 block text-slate-400">Pixel ID</span><input id="fieldPixelId" class="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none" /></label>
                      <label class="text-sm"><span class="mb-1 block text-slate-400">Nome do CAPI</span><input id="fieldCapiLabel" class="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none" /></label>
                    </div>
                    <label class="mt-3 block text-sm"><span class="mb-1 block text-slate-400">Token do CAPI</span><textarea id="fieldCapiToken" rows="4" class="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 font-mono text-xs text-white outline-none"></textarea></label>
                    <div class="mt-3 grid gap-3 sm:grid-cols-2">
                      <label class="text-sm"><span class="mb-1 block text-slate-400">Test code do CAPI</span><input id="fieldCapiTestCode" class="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none" /></label>
                      <label class="text-sm"><span class="mb-1 block text-slate-400">Content ID</span><input id="fieldContentId" class="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none" /></label>
                    </div>
                    <div class="mt-3 grid gap-3 sm:grid-cols-2">
                      <label class="text-sm"><span class="mb-1 block text-slate-400">Content name</span><input id="fieldContentName" class="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none" /></label>
                      <label class="text-sm"><span class="mb-1 block text-slate-400">Content type</span><input id="fieldContentType" class="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none" /></label>
                    </div>
                    <div class="mt-3 grid gap-3 sm:grid-cols-3">
                      <label class="text-sm"><span class="mb-1 block text-slate-400">Categoria tracking</span><input id="fieldContentCategory" class="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none" /></label>
                      <label class="text-sm"><span class="mb-1 block text-slate-400">Moeda</span><input id="fieldCurrency" class="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none" /></label>
                      <label class="text-sm"><span class="mb-1 block text-slate-400">Quantidade</span><input id="fieldQuantity" type="number" class="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none" /></label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  </div>

  <script defer src="/assets/js/admin.app.js"></script>
</body>
</html>`;
}

export async function onRequestGet(context) {
  if (!checkBasicAuth(context.request, context.env)) return unauthorized('Izzat Admin');
  return htmlResponse(renderAdminShell());
}
