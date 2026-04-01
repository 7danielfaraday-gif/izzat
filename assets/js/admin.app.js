(function () {
  const state = {
    store: null,
    metrics: null,
    orders: [],
    currentIndex: -1,
  };

  function $(id) {
    return document.getElementById(id);
  }

  function formatCurrency(value) {
    try {
      return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    } catch (error) {
      return 'R$ 0,00';
    }
  }

  function formatDate(value) {
    if (!value) return '-';
    try {
      return new Date(value).toLocaleString('pt-BR');
    } catch (error) {
      return String(value);
    }
  }

  function slugify(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80);
  }

  function setStatus(message, kind) {
    const element = $('statusMsg');
    if (!element) return;
    const color = kind === 'error' ? 'text-rose-400' : kind === 'warn' ? 'text-amber-300' : 'text-emerald-400';
    element.className = 'text-xs font-semibold ' + color;
    element.textContent = message;
  }

  function createBlankProduct() {
    const suffix = Date.now().toString(36).slice(-4);
    return {
      slug: 'novo-produto-' + suffix,
      active: true,
      is_default: false,
      title: 'Novo produto',
      short_description: '',
      seo_description: '',
      category: '',
      variant_label: 'Variacao padrao',
      prices: {
        original: 0,
        landing: 0,
        checkout: 0,
        discount_badge: '',
        discount_text: '',
      },
      stats: {
        rating_value: 5,
        rating_count: 0,
        sold_count: 0,
        review_count: 0,
        rating_breakdown: [
          { stars: 5, count: 0 },
          { stars: 4, count: 0 },
          { stars: 3, count: 0 },
          { stars: 2, count: 0 },
          { stars: 1, count: 0 },
        ],
      },
      images: [],
      visible_reviews: [],
      extra_reviews: [],
      description: {
        heading: 'Sobre o produto',
        text: '',
        bullets: [],
        info_title: 'Informacoes',
        info_text: '',
      },
      checkout: {
        offer_badge: 'OFERTA',
        guarantee_title: 'Satisfacao garantida',
        guarantee_text: '',
        submit_label: 'FINALIZAR',
        success_title_template: 'Quase la, {firstName}!',
        success_subtitle: '',
        payment_label: 'PIX',
        payment_badge: 'Aprovacao imediata',
        payment_instructions: [],
        footer_primary: 'Compra processada por Izzat',
        footer_secondary: 'Todos os direitos reservados',
      },
      pix: {
        pix_code: '',
        qrcode_url: '/assets/img/qrcode.webp',
      },
      tracking: {
        pixel_id: '',
        capi_access_token: '',
        capi_test_code: '',
        capi_label: '',
        content_id: '',
        content_name: '',
        content_type: 'product',
        content_category: '',
        currency: 'BRL',
        quantity: 1,
      },
      links: {
        landing_path: '/p/novo-produto-' + suffix,
        checkout_path: '/c/novo-produto-' + suffix,
      },
    };
  }

  function safeJsonParse(text, fallback, fieldLabel) {
    const value = String(text || '').trim();
    if (!value) return fallback;
    try {
      return JSON.parse(value);
    } catch (error) {
      throw new Error('JSON invalido em "' + fieldLabel + '".');
    }
  }

  function getCurrentProduct() {
    if (!state.store || !Array.isArray(state.store.products)) return null;
    return state.store.products[state.currentIndex] || null;
  }

  function updateLinkPreview(slug) {
    const safeSlug = slugify(slug || 'produto');
    $('previewLanding').textContent = '/p/' + safeSlug;
    $('previewCheckout').textContent = '/c/' + safeSlug;
  }

  function writeForm(product) {
    if (!product) return;
    $('fieldActive').checked = !!product.active;
    $('fieldDefault').checked = state.store && state.store.default_product_slug === product.slug;
    $('fieldSlug').value = product.slug || '';
    $('fieldTitle').value = product.title || '';
    $('fieldShortDescription').value = product.short_description || '';
    $('fieldSeoDescription').value = product.seo_description || '';
    $('fieldCategory').value = product.category || '';
    $('fieldVariantLabel').value = product.variant_label || '';

    $('fieldPriceOriginal').value = product.prices && product.prices.original != null ? product.prices.original : '';
    $('fieldPriceLanding').value = product.prices && product.prices.landing != null ? product.prices.landing : '';
    $('fieldPriceCheckout').value = product.prices && product.prices.checkout != null ? product.prices.checkout : '';
    $('fieldDiscountBadge').value = product.prices && product.prices.discount_badge || '';
    $('fieldDiscountText').value = product.prices && product.prices.discount_text || '';

    $('fieldRatingValue').value = product.stats && product.stats.rating_value != null ? product.stats.rating_value : '';
    $('fieldRatingCount').value = product.stats && product.stats.rating_count != null ? product.stats.rating_count : '';
    $('fieldSoldCount').value = product.stats && product.stats.sold_count != null ? product.stats.sold_count : '';
    $('fieldReviewCount').value = product.stats && product.stats.review_count != null ? product.stats.review_count : '';
    $('fieldRatingBreakdown').value = JSON.stringify((product.stats && product.stats.rating_breakdown) || [], null, 2);

    $('fieldImages').value = ((product.images || []).map(function (item) { return item.src || item; })).join('\n');
    $('fieldVisibleReviews').value = JSON.stringify(product.visible_reviews || [], null, 2);
    $('fieldExtraReviews').value = JSON.stringify(product.extra_reviews || [], null, 2);
    $('fieldDescriptionHeading').value = product.description && product.description.heading || '';
    $('fieldDescriptionText').value = product.description && product.description.text || '';
    $('fieldDescriptionBullets').value = JSON.stringify((product.description && product.description.bullets) || [], null, 2);
    $('fieldInfoTitle').value = product.description && product.description.info_title || '';
    $('fieldInfoText').value = product.description && product.description.info_text || '';

    $('fieldOfferBadge').value = product.checkout && product.checkout.offer_badge || '';
    $('fieldGuaranteeTitle').value = product.checkout && product.checkout.guarantee_title || '';
    $('fieldGuaranteeText').value = product.checkout && product.checkout.guarantee_text || '';
    $('fieldSubmitLabel').value = product.checkout && product.checkout.submit_label || '';
    $('fieldSuccessTitle').value = product.checkout && product.checkout.success_title_template || '';
    $('fieldSuccessSubtitle').value = product.checkout && product.checkout.success_subtitle || '';
    $('fieldPaymentLabel').value = product.checkout && product.checkout.payment_label || '';
    $('fieldPaymentBadge').value = product.checkout && product.checkout.payment_badge || '';
    $('fieldPaymentInstructions').value = JSON.stringify((product.checkout && product.checkout.payment_instructions) || [], null, 2);
    $('fieldFooterPrimary').value = product.checkout && product.checkout.footer_primary || '';
    $('fieldFooterSecondary').value = product.checkout && product.checkout.footer_secondary || '';

    $('fieldPixCode').value = product.pix && product.pix.pix_code || '';
    $('fieldQrUrl').value = product.pix && product.pix.qrcode_url === null ? '' : (product.pix && product.pix.qrcode_url) || '';
    $('fieldDisableQr').checked = !!(product.pix && product.pix.qrcode_url === null);

    $('fieldPixelId').value = product.tracking && product.tracking.pixel_id || '';
    $('fieldCapiToken').value = product.tracking && product.tracking.capi_access_token || '';
    $('fieldCapiTestCode').value = product.tracking && product.tracking.capi_test_code || '';
    $('fieldCapiLabel').value = product.tracking && product.tracking.capi_label || '';
    $('fieldContentId').value = product.tracking && product.tracking.content_id || '';
    $('fieldContentName').value = product.tracking && product.tracking.content_name || '';
    $('fieldContentType').value = product.tracking && product.tracking.content_type || '';
    $('fieldContentCategory').value = product.tracking && product.tracking.content_category || '';
    $('fieldCurrency').value = product.tracking && product.tracking.currency || 'BRL';
    $('fieldQuantity').value = product.tracking && product.tracking.quantity != null ? product.tracking.quantity : 1;

    updateLinkPreview(product.slug || '');
  }

  function readForm() {
    const slug = slugify($('fieldSlug').value || $('fieldTitle').value || 'produto');
    if (!slug) throw new Error('Defina um slug valido para o produto.');

    const images = String($('fieldImages').value || '')
      .split(/\r?\n/)
      .map(function (line) { return line.trim(); })
      .filter(Boolean)
      .map(function (src) { return { src: src }; });

    const qrcodeUrl = $('fieldDisableQr').checked ? null : (($('fieldQrUrl').value || '').trim() || '/assets/img/qrcode.webp');

    return {
      slug: slug,
      active: $('fieldActive').checked,
      is_default: $('fieldDefault').checked,
      title: $('fieldTitle').value.trim(),
      short_description: $('fieldShortDescription').value.trim(),
      seo_description: $('fieldSeoDescription').value.trim(),
      category: $('fieldCategory').value.trim(),
      variant_label: $('fieldVariantLabel').value.trim(),
      prices: {
        original: Number($('fieldPriceOriginal').value || 0),
        landing: Number($('fieldPriceLanding').value || 0),
        checkout: Number($('fieldPriceCheckout').value || 0),
        discount_badge: $('fieldDiscountBadge').value.trim(),
        discount_text: $('fieldDiscountText').value.trim(),
      },
      stats: {
        rating_value: Number($('fieldRatingValue').value || 0),
        rating_count: Number($('fieldRatingCount').value || 0),
        sold_count: Number($('fieldSoldCount').value || 0),
        review_count: Number($('fieldReviewCount').value || 0),
        rating_breakdown: safeJsonParse($('fieldRatingBreakdown').value, [], 'Resumo de estrelas'),
      },
      images: images,
      visible_reviews: safeJsonParse($('fieldVisibleReviews').value, [], 'Avaliacoes visiveis'),
      extra_reviews: safeJsonParse($('fieldExtraReviews').value, [], 'Avaliacoes extras'),
      description: {
        heading: $('fieldDescriptionHeading').value.trim(),
        text: $('fieldDescriptionText').value.trim(),
        bullets: safeJsonParse($('fieldDescriptionBullets').value, [], 'Bullets da descricao'),
        info_title: $('fieldInfoTitle').value.trim(),
        info_text: $('fieldInfoText').value.trim(),
      },
      checkout: {
        offer_badge: $('fieldOfferBadge').value.trim(),
        guarantee_title: $('fieldGuaranteeTitle').value.trim(),
        guarantee_text: $('fieldGuaranteeText').value.trim(),
        submit_label: $('fieldSubmitLabel').value.trim(),
        success_title_template: $('fieldSuccessTitle').value.trim(),
        success_subtitle: $('fieldSuccessSubtitle').value.trim(),
        payment_label: $('fieldPaymentLabel').value.trim(),
        payment_badge: $('fieldPaymentBadge').value.trim(),
        payment_instructions: safeJsonParse($('fieldPaymentInstructions').value, [], 'Passos de pagamento'),
        footer_primary: $('fieldFooterPrimary').value.trim(),
        footer_secondary: $('fieldFooterSecondary').value.trim(),
      },
      pix: {
        pix_code: $('fieldPixCode').value.trim(),
        qrcode_url: qrcodeUrl,
      },
      tracking: {
        pixel_id: $('fieldPixelId').value.trim(),
        capi_access_token: $('fieldCapiToken').value.trim(),
        capi_test_code: $('fieldCapiTestCode').value.trim(),
        capi_label: $('fieldCapiLabel').value.trim(),
        content_id: $('fieldContentId').value.trim(),
        content_name: $('fieldContentName').value.trim(),
        content_type: $('fieldContentType').value.trim(),
        content_category: $('fieldContentCategory').value.trim(),
        currency: $('fieldCurrency').value.trim() || 'BRL',
        quantity: Number($('fieldQuantity').value || 1),
      },
    };
  }

  function persistCurrentProduct() {
    if (!state.store || state.currentIndex < 0) return;
    const product = readForm();
    state.store.products[state.currentIndex] = product;
    if (product.is_default) {
      state.store.default_product_slug = product.slug;
    } else if (state.store.default_product_slug === getCurrentProduct().slug) {
      state.store.default_product_slug = state.store.products[0] ? state.store.products[0].slug : product.slug;
    }
  }

  function renderProductList() {
    const root = $('productList');
    if (!root || !state.store) return;
    root.innerHTML = '';

    state.store.products.forEach(function (product, index) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'w-full rounded-2xl border px-4 py-3 text-left transition ' + (index === state.currentIndex ? 'border-emerald-400 bg-emerald-500/10' : 'border-white/10 bg-slate-900/40 hover:bg-slate-900/70');
      button.innerHTML = ''
        + '<div class="flex items-center justify-between gap-3">'
        + '<div>'
        + '<div class="font-semibold text-white">' + (product.title || 'Produto sem titulo') + '</div>'
        + '<div class="mt-1 text-xs text-slate-400">/' + (product.slug || '') + '</div>'
        + '</div>'
        + '<div class="text-right text-xs">'
        + '<div class="' + (product.active ? 'text-emerald-300' : 'text-rose-300') + '">' + (product.active ? 'Ativo' : 'Pausado') + '</div>'
        + '<div class="mt-1 text-slate-500">' + (state.store.default_product_slug === product.slug ? 'Padrao' : '') + '</div>'
        + '</div>'
        + '</div>';
      button.addEventListener('click', function () {
        try { persistCurrentProduct(); } catch (error) { setStatus(error.message, 'error'); return; }
        state.currentIndex = index;
        writeForm(state.store.products[state.currentIndex]);
        renderProductList();
      });
      root.appendChild(button);
    });
  }

  function renderMetrics() {
    const metrics = state.metrics || {};
    const orders = Array.isArray(state.orders) ? state.orders : [];
    const today = new Date().toISOString().slice(0, 10);
    const ordersToday = orders.filter(function (order) {
      return order.created_at && String(order.created_at).slice(0, 10) === today;
    }).length;
    const activeProducts = state.store ? state.store.products.filter(function (product) { return product.active; }).length : 0;

    $('onlineNow').textContent = String(metrics.online_now || 0);
    $('pixClicks').textContent = String(metrics.pix_copy_clicks_total || 0);
    $('ordersToday').textContent = String(ordersToday);
    $('ordersTotal').textContent = String(orders.length);
    $('productsActive').textContent = String(activeProducts);
  }

  function renderOrders() {
    const root = $('ordersBody');
    if (!root) return;

    if (!state.orders.length) {
      root.innerHTML = '<div class="px-6 py-12 text-center text-sm text-slate-400">Nenhum pedido encontrado.</div>';
      return;
    }

    const rows = state.orders.map(function (order) {
      return ''
        + '<tr class="border-b border-white/5">'
        + '<td class="px-4 py-3"><div class="font-semibold text-white">' + (order.name || '-') + '</div><div class="text-xs text-slate-500">' + (order.id || '-') + '</div></td>'
        + '<td class="px-4 py-3"><div class="text-slate-200">' + (order.product_name || order.product_slug || '-') + '</div><div class="text-xs text-slate-500">' + (order.product_id || '-') + '</div></td>'
        + '<td class="px-4 py-3"><div>' + (order.phone || '-') + '</div><div class="text-xs text-slate-500">' + (order.email || '-') + '</div></td>'
        + '<td class="px-4 py-3 text-slate-400">' + formatDate(order.created_at) + '</td>'
        + '<td class="px-4 py-3 text-right font-bold text-emerald-300">' + formatCurrency(order.value || 0) + '</td>'
        + '</tr>';
    }).join('');

    root.innerHTML = ''
      + '<table class="w-full text-sm">'
      + '<thead><tr class="border-b border-white/10 text-left text-xs uppercase tracking-wide text-slate-500">'
      + '<th class="px-4 py-3">Cliente</th>'
      + '<th class="px-4 py-3">Produto</th>'
      + '<th class="px-4 py-3">Contato</th>'
      + '<th class="px-4 py-3">Data</th>'
      + '<th class="px-4 py-3 text-right">Valor</th>'
      + '</tr></thead>'
      + '<tbody>' + rows + '</tbody>'
      + '</table>';
  }

  async function loadMetrics() {
    const response = await fetch('/api/metrics/stats?_=' + Date.now(), { cache: 'no-store' });
    const data = await response.json();
    if (!data || !data.ok) throw new Error('Falha ao carregar metricas.');
    state.metrics = data;
  }

  async function loadOrders() {
    const response = await fetch('/api/orders?_=' + Date.now(), { cache: 'no-store' });
    const data = await response.json();
    if (!data || !data.ok || !Array.isArray(data.orders)) throw new Error('Falha ao carregar pedidos.');
    state.orders = data.orders;
  }

  async function loadStore() {
    const response = await fetch('/api/store-admin?_=' + Date.now(), { cache: 'no-store' });
    const data = await response.json();
    if (!data || !data.ok || !data.store) throw new Error('Falha ao carregar catalogo.');
    state.store = data.store;
    if (!state.store.products.length) state.store.products.push(createBlankProduct());
    state.currentIndex = 0;
  }

  async function saveStore() {
    persistCurrentProduct();
    const response = await fetch('/api/store-admin', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        default_product_slug: $('fieldDefault').checked ? $('fieldSlug').value.trim() : state.store.default_product_slug,
        products: state.store.products,
      }),
    });
    const data = await response.json();
    if (!response.ok || !data || !data.ok || !data.store) {
      throw new Error('Nao foi possivel salvar os produtos.');
    }
    state.store = data.store;
    state.currentIndex = Math.max(0, state.store.products.findIndex(function (product) {
      return product.slug === $('fieldSlug').value.trim();
    }));
    if (state.currentIndex < 0) state.currentIndex = 0;
    writeForm(state.store.products[state.currentIndex]);
    renderProductList();
    renderMetrics();
  }

  function bindNav() {
    document.querySelectorAll('[data-section]').forEach(function (button) {
      button.addEventListener('click', function () {
        const section = button.getAttribute('data-section');
        document.querySelectorAll('.admin-section').forEach(function (panel) {
          panel.classList.add('hidden');
        });
        document.querySelectorAll('[data-section]').forEach(function (item) {
          item.classList.remove('bg-emerald-500/15', 'text-emerald-300', 'border-emerald-500/30');
          item.classList.add('text-slate-300');
        });
        $('section-' + section).classList.remove('hidden');
        button.classList.add('bg-emerald-500/15', 'text-emerald-300', 'border-emerald-500/30');
      });
    });
  }

  function bindForm() {
    $('fieldTitle').addEventListener('input', function () {
      if (!$('fieldSlug').dataset.touched) {
        $('fieldSlug').value = slugify($('fieldTitle').value);
        updateLinkPreview($('fieldSlug').value);
      }
    });

    $('fieldSlug').addEventListener('input', function () {
      $('fieldSlug').dataset.touched = '1';
      $('fieldSlug').value = slugify($('fieldSlug').value);
      updateLinkPreview($('fieldSlug').value);
    });

    $('newProduct').addEventListener('click', function () {
      try { persistCurrentProduct(); } catch (error) { setStatus(error.message, 'error'); return; }
      state.store.products.unshift(createBlankProduct());
      state.currentIndex = 0;
      writeForm(state.store.products[0]);
      renderProductList();
      setStatus('Novo produto criado no formulario. Salve para publicar.', 'warn');
    });

    $('duplicateProduct').addEventListener('click', function () {
      try { persistCurrentProduct(); } catch (error) { setStatus(error.message, 'error'); return; }
      const current = getCurrentProduct();
      if (!current) return;
      const clone = JSON.parse(JSON.stringify(current));
      clone.slug = slugify((current.slug || 'produto') + '-copy-' + Date.now().toString(36).slice(-4));
      clone.title = (current.title || 'Produto') + ' (Copia)';
      clone.is_default = false;
      state.store.products.unshift(clone);
      state.currentIndex = 0;
      writeForm(clone);
      renderProductList();
      setStatus('Produto duplicado. Ajuste e salve.', 'warn');
    });

    $('removeProduct').addEventListener('click', function () {
      if (!state.store || state.store.products.length <= 1) {
        setStatus('Mantenha ao menos um produto cadastrado.', 'error');
        return;
      }
      const current = getCurrentProduct();
      if (!current) return;
      if (!window.confirm('Remover o produto "' + (current.title || current.slug) + '"?')) return;
      state.store.products.splice(state.currentIndex, 1);
      if (state.store.default_product_slug === current.slug) {
        state.store.default_product_slug = state.store.products[0].slug;
      }
      state.currentIndex = 0;
      writeForm(state.store.products[0]);
      renderProductList();
      setStatus('Produto removido do catalogo. Salve para publicar.', 'warn');
    });

    $('saveProducts').addEventListener('click', async function () {
      setStatus('Salvando produtos...', 'warn');
      try {
        await saveStore();
        setStatus('Produtos salvos com sucesso.');
      } catch (error) {
        setStatus(error.message, 'error');
      }
    });

    $('refreshData').addEventListener('click', async function () {
      setStatus('Recarregando dados...', 'warn');
      try {
        await initialize();
        setStatus('Dados atualizados.');
      } catch (error) {
        setStatus(error.message, 'error');
      }
    });

    $('openLanding').addEventListener('click', function () {
      const slug = slugify($('fieldSlug').value || '');
      if (!slug) return;
      window.open('/p/' + slug, '_blank');
    });

    $('openCheckout').addEventListener('click', function () {
      const slug = slugify($('fieldSlug').value || '');
      if (!slug) return;
      window.open('/c/' + slug, '_blank');
    });
  }

  async function initialize() {
    await Promise.all([loadStore(), loadOrders(), loadMetrics()]);
    writeForm(state.store.products[state.currentIndex]);
    renderProductList();
    renderOrders();
    renderMetrics();
  }

  bindNav();
  bindForm();
  initialize()
    .then(function () {
      setStatus('Painel carregado.');
    })
    .catch(function (error) {
      console.error(error);
      setStatus(error.message || 'Falha ao carregar o painel.', 'error');
    });
})();
