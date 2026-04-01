(function () {
  const PRODUCT_TABS = [
    { id: 'overview', label: 'Visao geral' },
    { id: 'media', label: 'Midias' },
    { id: 'reviews', label: 'Avaliacoes' },
    { id: 'lp', label: 'LP' },
    { id: 'checkout', label: 'Checkout' },
    { id: 'tracking', label: 'Pixel e CAPI' },
  ];

  const INPUT_CLASS = 'w-full rounded-2xl border border-white/10 bg-slate-950 px-3 py-3 text-white outline-none transition focus:border-emerald-400/60';
  const TEXTAREA_CLASS = 'w-full rounded-2xl border border-white/10 bg-slate-950 px-3 py-3 text-white outline-none transition focus:border-emerald-400/60';
  const PANEL_CLASS = 'rounded-3xl border border-white/10 bg-slate-950/50 p-4';

  const state = {
    store: null,
    metrics: null,
    orders: [],
    currentIndex: -1,
    currentProductTab: 'overview',
    currentSection: 'dashboard',
    dirty: false,
    uploadContext: null,
  };

  function $(id) {
    return document.getElementById(id);
  }

  function hasText(value) {
    return typeof value === 'string' && value.trim().length > 0;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatCurrency(value) {
    try {
      return Number(value || 0).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      });
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

  function todayIso() {
    return new Date().toISOString().slice(0, 10);
  }

  function slugify(value) {
    const normalized = String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80);
    return normalized || 'produto';
  }

  function setStatus(message, kind) {
    const element = $('statusMsg');
    if (!element) return;
    const color = kind === 'error'
      ? 'text-rose-300'
      : kind === 'warn'
        ? 'text-amber-300'
        : 'text-emerald-300';
    element.className = 'mb-5 text-sm font-semibold ' + color;
    element.textContent = message;
  }

  function markDirty(message) {
    state.dirty = true;
    setStatus(message || 'Alteracoes salvas apenas no rascunho. Clique em "Salvar produtos" para publicar.', 'warn');
  }

  function clearDirty(message) {
    state.dirty = false;
    setStatus(message || 'Painel carregado.', 'ok');
  }

  function splitLines(value) {
    return String(value || '')
      .split(/\r?\n/)
      .map(function (line) { return line.trim(); })
      .filter(Boolean);
  }

  function buildBlankProductSeed(suffix) {
    const token = suffix || Date.now().toString(36).slice(-4);
    const slug = 'novo-produto-' + token;
    return {
      slug: slug,
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
        image: '',
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
        qrcode_url: '',
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
      __manualSlug: false,
    };
  }

  function ensureRatingBreakdown(value) {
    const current = Array.isArray(value) ? value : [];
    return [5, 4, 3, 2, 1].map(function (stars) {
      const found = current.find(function (item) {
        return Number(item && item.stars) === stars;
      });
      return {
        stars: stars,
        count: Math.max(0, Number(found && found.count ? found.count : 0)),
      };
    });
  }

  function hydrateImage(item, index, title) {
    if (typeof item === 'string') {
      return {
        src: item,
        thumbnail: item,
        alt: (title || 'Produto') + ' imagem ' + (index + 1),
      };
    }

    return {
      src: item && item.src ? String(item.src) : '',
      thumbnail: item && item.thumbnail ? String(item.thumbnail) : (item && item.src ? String(item.src) : ''),
      alt: item && item.alt ? String(item.alt) : ((title || 'Produto') + ' imagem ' + (index + 1)),
    };
  }

  function hydrateReview(review, index) {
    const raw = review && typeof review === 'object' ? review : {};
    const images = Array.isArray(raw.images)
      ? raw.images.map(function (image) { return String(image || '').trim(); }).filter(Boolean)
      : splitLines(raw.images || '');

    return {
      name: hasText(raw.name) ? String(raw.name).trim() : 'Cliente ' + (index + 1),
      date: hasText(raw.date) ? String(raw.date).trim() : todayIso(),
      rating: Math.min(5, Math.max(1, Math.round(Number(raw.rating || 5) || 5))),
      variant: hasText(raw.variant) ? String(raw.variant).trim() : '',
      comment: hasText(raw.comment) ? String(raw.comment).trim() : '',
      avatar: hasText(raw.avatar) ? String(raw.avatar).trim() : '',
      avatar_color: hasText(raw.avatar_color) ? String(raw.avatar_color).trim() : '#22c55e',
      images: images,
    };
  }

  function hydrateBullet(bullet, index) {
    const raw = bullet && typeof bullet === 'object' ? bullet : {};
    return {
      icon: hasText(raw.icon) ? String(raw.icon).trim() : '9733',
      title: hasText(raw.title) ? String(raw.title).trim() : 'Destaque ' + (index + 1),
      text: hasText(raw.text) ? String(raw.text).trim() : '',
    };
  }

  function hydratePaymentStep(step, index) {
    const raw = step && typeof step === 'object' ? step : {};
    return {
      title: hasText(raw.title) ? String(raw.title).trim() : 'Passo ' + (index + 1),
      desc: hasText(raw.desc) ? String(raw.desc).trim() : '',
    };
  }

  function hydrateProduct(product) {
    const seed = buildBlankProductSeed((Date.now() + Math.random()).toString(36).slice(-4));
    const raw = clone(product || {});

    raw.slug = slugify(raw.slug || raw.title || seed.slug);
    raw.title = hasText(raw.title) ? String(raw.title).trim() : 'Produto sem titulo';
    raw.short_description = raw.short_description == null ? '' : String(raw.short_description);
    raw.seo_description = raw.seo_description == null ? '' : String(raw.seo_description);
    raw.category = raw.category == null ? '' : String(raw.category);
    raw.variant_label = raw.variant_label == null ? seed.variant_label : String(raw.variant_label);
    raw.active = raw.active !== false;

    raw.prices = Object.assign({}, seed.prices, raw.prices || {});
    raw.stats = Object.assign({}, seed.stats, raw.stats || {});
    raw.stats.rating_breakdown = ensureRatingBreakdown(raw.stats.rating_breakdown);

    raw.images = Array.isArray(raw.images)
      ? raw.images.map(function (item, index) { return hydrateImage(item, index, raw.title); })
      : [];

    raw.visible_reviews = Array.isArray(raw.visible_reviews)
      ? raw.visible_reviews.map(function (item, index) { return hydrateReview(item, index); })
      : [];
    raw.extra_reviews = Array.isArray(raw.extra_reviews)
      ? raw.extra_reviews.map(function (item, index) { return hydrateReview(item, index); })
      : [];

    raw.description = Object.assign({}, seed.description, raw.description || {});
    raw.description.bullets = Array.isArray(raw.description.bullets)
      ? raw.description.bullets.map(function (item, index) { return hydrateBullet(item, index); })
      : [];

    raw.checkout = Object.assign({}, seed.checkout, raw.checkout || {});
    raw.checkout.image = raw.checkout.image == null ? '' : String(raw.checkout.image);
    raw.checkout.payment_instructions = Array.isArray(raw.checkout.payment_instructions)
      ? raw.checkout.payment_instructions.map(function (item, index) { return hydratePaymentStep(item, index); })
      : [];

    raw.pix = Object.assign({}, seed.pix, raw.pix || {});
    raw.tracking = Object.assign({}, seed.tracking, raw.tracking || {});
    raw.tracking.quantity = Math.max(1, Number(raw.tracking.quantity || 1));

    raw.__manualSlug = raw.__manualSlug !== undefined ? Boolean(raw.__manualSlug) : true;
    return raw;
  }

  function hydrateStore(store) {
    const raw = store && typeof store === 'object' ? store : {};
    const products = Array.isArray(raw.products) && raw.products.length
      ? raw.products.map(hydrateProduct)
      : [hydrateProduct(buildBlankProductSeed())];
    const defaultSlug = products.some(function (product) { return product.slug === raw.default_product_slug; })
      ? raw.default_product_slug
      : products[0].slug;

    return {
      schema_version: raw.schema_version || 2,
      default_product_slug: defaultSlug,
      updated_at: raw.updated_at || null,
      products: products,
    };
  }

  function getCurrentProduct() {
    if (!state.store || !Array.isArray(state.store.products)) return null;
    return state.store.products[state.currentIndex] || null;
  }

  function getProductLinks(product) {
    const safeSlug = slugify(product && (product.slug || product.title));
    return {
      landing: '/p/' + safeSlug,
      checkout: '/c/' + safeSlug,
    };
  }

  function getCheckoutImage(product) {
    if (!product) return '/assets/img/01.webp';
    return product.checkout && hasText(product.checkout.image)
      ? product.checkout.image
      : ((product.images && product.images[0] && product.images[0].src) || '/assets/img/01.webp');
  }

  function syncReviewCount(product) {
    if (!product || !product.stats) return;
    product.stats.review_count = (product.visible_reviews || []).length + (product.extra_reviews || []).length;
  }

  function setByPath(target, path, value) {
    const parts = String(path || '').split('.');
    let cursor = target;
    for (let index = 0; index < parts.length - 1; index += 1) {
      const key = /^\d+$/.test(parts[index]) ? Number(parts[index]) : parts[index];
      if (cursor[key] == null) cursor[key] = /^\d+$/.test(parts[index + 1]) ? [] : {};
      cursor = cursor[key];
    }
    const lastKey = /^\d+$/.test(parts[parts.length - 1]) ? Number(parts[parts.length - 1]) : parts[parts.length - 1];
    cursor[lastKey] = value;
  }

  function moveItem(list, index, delta) {
    const nextIndex = index + delta;
    if (!Array.isArray(list)) return;
    if (index < 0 || nextIndex < 0 || index >= list.length || nextIndex >= list.length) return;
    const item = list[index];
    list.splice(index, 1);
    list.splice(nextIndex, 0, item);
  }

  function serializeProducts() {
    return state.store.products.map(function (product) {
      const cloneProduct = clone(product);
      delete cloneProduct.links;
      delete cloneProduct.tracking_content;
      delete cloneProduct.__manualSlug;
      return cloneProduct;
    });
  }

  function renderInput(config) {
    return ''
      + '<label class="' + (config.wrapperClass || 'block text-sm') + '">'
      + '<span class="mb-2 block font-semibold text-slate-300">' + escapeHtml(config.label) + '</span>'
      + '<input data-field="' + escapeHtml(config.field) + '" type="' + escapeHtml(config.type || 'text') + '"'
      + ' value="' + escapeHtml(config.value == null ? '' : config.value) + '"'
      + (config.placeholder ? ' placeholder="' + escapeHtml(config.placeholder) + '"' : '')
      + (config.min != null ? ' min="' + escapeHtml(config.min) + '"' : '')
      + (config.max != null ? ' max="' + escapeHtml(config.max) + '"' : '')
      + (config.step != null ? ' step="' + escapeHtml(config.step) + '"' : '')
      + ' class="' + (config.className || INPUT_CLASS) + '" />'
      + (config.hint ? '<span class="mt-2 block text-xs text-slate-500">' + escapeHtml(config.hint) + '</span>' : '')
      + '</label>';
  }

  function renderTextarea(config) {
    return ''
      + '<label class="' + (config.wrapperClass || 'block text-sm') + '">'
      + '<span class="mb-2 block font-semibold text-slate-300">' + escapeHtml(config.label) + '</span>'
      + '<textarea'
      + (config.field ? ' data-field="' + escapeHtml(config.field) + '"' : '')
      + (config.linesField ? ' data-lines-field="' + escapeHtml(config.linesField) + '"' : '')
      + ' rows="' + escapeHtml(config.rows || 4) + '"'
      + ' class="' + (config.className || TEXTAREA_CLASS) + '"'
      + (config.placeholder ? ' placeholder="' + escapeHtml(config.placeholder) + '"' : '')
      + '>' + escapeHtml(config.value == null ? '' : config.value) + '</textarea>'
      + (config.hint ? '<span class="mt-2 block text-xs text-slate-500">' + escapeHtml(config.hint) + '</span>' : '')
      + '</label>';
  }

  function renderToggle(config) {
    return ''
      + '<label class="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-200">'
      + '<input type="checkbox"'
      + (config.field ? ' data-field="' + escapeHtml(config.field) + '"' : '')
      + (config.action ? ' data-action="' + escapeHtml(config.action) + '"' : '')
      + (config.checked ? ' checked' : '')
      + ' class="h-4 w-4 rounded accent-emerald-400" />'
      + '<span>' + escapeHtml(config.label) + '</span>'
      + '</label>';
  }

  function renderBadge(label, value, tone) {
    const toneClass = tone === 'ok'
      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
      : tone === 'warn'
        ? 'border-amber-500/30 bg-amber-500/10 text-amber-100'
        : 'border-white/10 bg-slate-950/60 text-slate-100';

    return ''
      + '<div class="rounded-2xl border ' + toneClass + ' px-4 py-3">'
      + '<div class="text-[11px] font-bold uppercase tracking-[0.22em] opacity-70">' + escapeHtml(label) + '</div>'
      + '<div class="mt-2 text-sm font-bold">' + escapeHtml(value) + '</div>'
      + '</div>';
  }

  function renderProductSummary(product) {
    const root = $('productSummary');
    if (!root || !product) return;
    const links = getProductLinks(product);
    const totalReviews = (product.visible_reviews || []).length + (product.extra_reviews || []).length;
    const mediaCount = (product.images || []).length;
    const pixelReady = hasText(product.tracking && product.tracking.pixel_id);
    const pixReady = hasText(product.pix && product.pix.pix_code);

    root.innerHTML = ''
      + '<div class="grid gap-3 lg:grid-cols-[140px,repeat(4,minmax(0,1fr))]">'
      + '<div class="rounded-3xl border border-white/10 bg-slate-950/60 p-3">'
      + '<div class="aspect-square overflow-hidden rounded-2xl bg-white/5">'
      + '<img src="' + escapeHtml(getCheckoutImage(product)) + '" alt="' + escapeHtml(product.title) + '" class="h-full w-full object-contain" />'
      + '</div>'
      + '</div>'
      + renderBadge('LP', links.landing, 'neutral')
      + renderBadge('Checkout', links.checkout, 'neutral')
      + renderBadge('Midias', String(mediaCount) + ' imagens', mediaCount ? 'ok' : 'warn')
      + renderBadge('Avaliacoes', String(totalReviews) + ' cadastradas', totalReviews ? 'ok' : 'warn')
      + '</div>'
      + '<div class="mt-3 grid gap-3 md:grid-cols-2">'
      + renderBadge('PIX', pixReady ? 'Configurado' : 'Pendente', pixReady ? 'ok' : 'warn')
      + renderBadge('Pixel / CAPI', pixelReady ? 'Pixel pronto' : 'Pixel nao configurado', pixelReady ? 'ok' : 'warn')
      + '</div>';
  }

  function renderProductHeader() {
    const product = getCurrentProduct();
    $('productHeading').textContent = product ? (product.title || 'Produto sem titulo') : 'Nenhum produto';
    $('productSubheading').textContent = product
      ? (getProductLinks(product).landing + ' • ' + (state.store.default_product_slug === product.slug ? 'produto padrao da home' : 'produto individual'))
      : '';
    renderProductSummary(product);
  }

  function renderProductTabs() {
    const root = $('productTabs');
    if (!root) return;
    root.innerHTML = PRODUCT_TABS.map(function (tab) {
      const active = state.currentProductTab === tab.id;
      return ''
        + '<button type="button" data-action="switch-product-tab" data-tab="' + escapeHtml(tab.id) + '"'
        + ' class="rounded-2xl border px-4 py-2.5 text-sm font-bold transition '
        + (active
          ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-200'
          : 'border-white/10 bg-slate-950/50 text-slate-300 hover:bg-white/5')
        + '">' + escapeHtml(tab.label) + '</button>';
    }).join('');
  }

  function renderProductList() {
    const root = $('productList');
    if (!root || !state.store) return;
    root.innerHTML = state.store.products.map(function (product, index) {
      const active = index === state.currentIndex;
      return ''
        + '<button type="button" data-action="select-product" data-index="' + index + '" class="w-full rounded-3xl border px-3 py-3 text-left transition '
        + (active ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-white/10 bg-slate-950/60 hover:bg-white/5')
        + '">'
        + '<div class="flex items-start gap-3">'
        + '<div class="h-14 w-14 overflow-hidden rounded-2xl border border-white/10 bg-white/5"><img src="' + escapeHtml(getCheckoutImage(product)) + '" alt="' + escapeHtml(product.title) + '" class="h-full w-full object-contain" /></div>'
        + '<div class="min-w-0 flex-1">'
        + '<div class="flex items-start justify-between gap-2">'
        + '<div class="min-w-0"><div class="truncate font-bold text-white">' + escapeHtml(product.title || 'Produto sem titulo') + '</div><div class="mt-1 truncate text-xs text-slate-500">/' + escapeHtml(product.slug || '') + '</div></div>'
        + '<div class="text-right text-[11px] font-bold"><div class="' + (product.active ? 'text-emerald-300' : 'text-rose-300') + '">' + (product.active ? 'Ativo' : 'Pausado') + '</div>' + (state.store.default_product_slug === product.slug ? '<div class="mt-1 text-amber-200">Padrao</div>' : '') + '</div>'
        + '</div>'
        + '<div class="mt-3 flex items-center justify-between text-xs text-slate-400"><span>' + escapeHtml(formatCurrency(product.prices && product.prices.landing)) + '</span><span>' + escapeHtml(String((product.visible_reviews || []).length + (product.extra_reviews || []).length)) + ' aval.</span></div>'
        + '</div>'
        + '</div>'
        + '</button>';
    }).join('');
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
        + '<td class="px-4 py-3"><div class="font-semibold text-white">' + escapeHtml(order.name || '-') + '</div><div class="text-xs text-slate-500">' + escapeHtml(order.id || '-') + '</div></td>'
        + '<td class="px-4 py-3"><div class="text-slate-200">' + escapeHtml(order.product_name || order.product_slug || '-') + '</div><div class="text-xs text-slate-500">' + escapeHtml(order.product_id || '-') + '</div></td>'
        + '<td class="px-4 py-3"><div>' + escapeHtml(order.phone || '-') + '</div><div class="text-xs text-slate-500">' + escapeHtml(order.email || '-') + '</div></td>'
        + '<td class="px-4 py-3 text-slate-400">' + escapeHtml(formatDate(order.created_at)) + '</td>'
        + '<td class="px-4 py-3 text-right font-bold text-emerald-300">' + escapeHtml(formatCurrency(order.value || 0)) + '</td>'
        + '</tr>';
    }).join('');

    root.innerHTML = ''
      + '<table class="w-full min-w-[760px] text-sm">'
      + '<thead><tr class="border-b border-white/10 text-left text-xs uppercase tracking-[0.22em] text-slate-500">'
      + '<th class="px-4 py-3">Cliente</th>'
      + '<th class="px-4 py-3">Produto</th>'
      + '<th class="px-4 py-3">Contato</th>'
      + '<th class="px-4 py-3">Data</th>'
      + '<th class="px-4 py-3 text-right">Valor</th>'
      + '</tr></thead>'
      + '<tbody>' + rows + '</tbody>'
      + '</table>';
  }

  function renderOverviewTab(product) {
    return ''
      + '<div class="grid gap-4 xl:grid-cols-2">'
      + '<div class="' + PANEL_CLASS + '">'
      + '<div class="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Basico</div>'
      + '<div class="grid gap-3">'
      + renderInput({ label: 'Titulo do produto', field: 'title', value: product.title })
      + renderInput({ label: 'Slug', field: 'slug', value: product.slug, hint: 'Usado na URL da LP e do checkout.' })
      + '<div class="grid gap-3 md:grid-cols-2">'
      + renderInput({ label: 'Categoria', field: 'category', value: product.category })
      + renderInput({ label: 'Variante', field: 'variant_label', value: product.variant_label })
      + '</div>'
      + renderTextarea({ label: 'Descricao curta da LP', field: 'short_description', rows: 3, value: product.short_description })
      + renderTextarea({ label: 'Descricao SEO / meta', field: 'seo_description', rows: 3, value: product.seo_description })
      + '<div class="grid gap-3 md:grid-cols-2">'
      + renderToggle({ label: 'Produto ativo', field: 'active', checked: !!product.active })
      + renderToggle({ label: 'Produto padrao da home', action: 'toggle-default', checked: state.store.default_product_slug === product.slug })
      + '</div>'
      + '</div>'
      + '</div>'
      + '<div class="' + PANEL_CLASS + '">'
      + '<div class="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Precos</div>'
      + '<div class="grid gap-3 md:grid-cols-3">'
      + renderInput({ label: 'Preco cheio', field: 'prices.original', type: 'number', step: '0.01', value: product.prices.original })
      + renderInput({ label: 'Preco LP', field: 'prices.landing', type: 'number', step: '0.01', value: product.prices.landing })
      + renderInput({ label: 'Preco checkout', field: 'prices.checkout', type: 'number', step: '0.01', value: product.prices.checkout })
      + '</div>'
      + '<div class="mt-3 grid gap-3 md:grid-cols-2">'
      + renderInput({ label: 'Badge de desconto', field: 'prices.discount_badge', value: product.prices.discount_badge })
      + renderInput({ label: 'Texto de economia', field: 'prices.discount_text', value: product.prices.discount_text })
      + '</div>'
      + '<div class="mt-5 text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Prova social</div>'
      + '<div class="mt-3 grid gap-3 md:grid-cols-4">'
      + renderInput({ label: 'Nota', field: 'stats.rating_value', type: 'number', step: '0.1', value: product.stats.rating_value })
      + renderInput({ label: 'Qtd. notas', field: 'stats.rating_count', type: 'number', step: '1', value: product.stats.rating_count })
      + renderInput({ label: 'Vendidos', field: 'stats.sold_count', type: 'number', step: '1', value: product.stats.sold_count })
      + renderInput({ label: 'Qtd. avaliacoes', field: 'stats.review_count', type: 'number', step: '1', value: product.stats.review_count })
      + '</div>'
      + '<div class="mt-4 rounded-2xl border border-white/10 bg-slate-950/60 p-4">'
      + '<div class="mb-3 text-sm font-bold text-white">Resumo por estrelas</div>'
      + '<div class="grid gap-3 md:grid-cols-5">'
      + product.stats.rating_breakdown.map(function (item, index) {
        return renderInput({
          label: item.stars + ' estrela(s)',
          field: 'stats.rating_breakdown.' + index + '.count',
          type: 'number',
          step: '1',
          value: item.count,
        });
      }).join('')
      + '</div>'
      + '</div>'
      + '</div>'
      + '</div>';
  }

  function renderGalleryCard(image, index) {
    return ''
      + '<div class="rounded-3xl border border-white/10 bg-slate-950/60 p-4">'
      + '<div class="aspect-square overflow-hidden rounded-2xl bg-white/5">'
      + (hasText(image.src)
        ? '<img src="' + escapeHtml(image.src) + '" alt="' + escapeHtml(image.alt || 'Imagem') + '" class="h-full w-full object-contain" />'
        : '<div class="flex h-full items-center justify-center text-sm font-semibold text-slate-500">Sem imagem</div>')
      + '</div>'
      + '<div class="mt-3 flex flex-wrap gap-2">'
      + '<button type="button" data-action="replace-gallery-image" data-index="' + index + '" class="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-200 transition hover:bg-white/10">Trocar imagem</button>'
      + '<button type="button" data-action="set-checkout-image-from-gallery" data-index="' + index + '" class="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-200 transition hover:bg-emerald-500/20">Usar no checkout</button>'
      + '<button type="button" data-action="move-gallery-image" data-index="' + index + '" data-delta="-1" class="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-200 transition hover:bg-white/10">Subir</button>'
      + '<button type="button" data-action="move-gallery-image" data-index="' + index + '" data-delta="1" class="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-200 transition hover:bg-white/10">Descer</button>'
      + '<button type="button" data-action="remove-gallery-image" data-index="' + index + '" class="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-100 transition hover:bg-rose-500/20">Remover</button>'
      + '</div>'
      + '<div class="mt-4 grid gap-3">'
      + renderInput({ label: 'Arquivo / URL', field: 'images.' + index + '.src', value: image.src })
      + renderInput({ label: 'Miniatura', field: 'images.' + index + '.thumbnail', value: image.thumbnail })
      + renderInput({ label: 'Texto alt', field: 'images.' + index + '.alt', value: image.alt })
      + '</div>'
      + '</div>';
  }

  function renderMediaTab(product) {
    return ''
      + '<div class="space-y-4">'
      + '<div class="' + PANEL_CLASS + '">'
      + '<div class="flex flex-wrap items-start justify-between gap-3">'
      + '<div><div class="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Galeria da LP</div><p class="mt-2 text-sm text-slate-400">Envie as fotos principais do produto. A primeira costuma funcionar como capa da LP.</p></div>'
      + '<div class="flex flex-wrap gap-2">'
      + '<button type="button" data-action="upload-gallery-images" class="rounded-2xl bg-emerald-400 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-300">Upar fotos</button>'
      + '<button type="button" data-action="add-gallery-image" class="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-slate-200 transition hover:bg-white/10">Adicionar espaco</button>'
      + '</div>'
      + '</div>'
      + '<div class="mt-4 grid gap-4 xl:grid-cols-2">'
      + ((product.images || []).length
        ? product.images.map(renderGalleryCard).join('')
        : '<div class="rounded-3xl border border-dashed border-white/15 bg-slate-950/40 p-8 text-center text-sm text-slate-400 xl:col-span-2">Nenhuma foto cadastrada ainda. Use "Upar fotos" para adicionar a galeria da LP.</div>')
      + '</div>'
      + '</div>'
      + '<div class="' + PANEL_CLASS + '">'
      + '<div class="flex flex-wrap items-start justify-between gap-3">'
      + '<div><div class="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Imagem do checkout</div><p class="mt-2 text-sm text-slate-400">Essa foto aparece no resumo do pedido e pode ser diferente da capa da LP.</p></div>'
      + '<div class="flex flex-wrap gap-2">'
      + '<button type="button" data-action="upload-checkout-image" class="rounded-2xl bg-emerald-400 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-300">Upar foto do checkout</button>'
      + '<button type="button" data-action="use-first-gallery-as-checkout" class="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-slate-200 transition hover:bg-white/10">Usar primeira foto da LP</button>'
      + '<button type="button" data-action="clear-checkout-image" class="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm font-bold text-rose-100 transition hover:bg-rose-500/20">Limpar</button>'
      + '</div>'
      + '</div>'
      + '<div class="mt-4 grid gap-4 lg:grid-cols-[220px,minmax(0,1fr)]">'
      + '<div class="rounded-3xl border border-white/10 bg-slate-900/60 p-4"><div class="aspect-square overflow-hidden rounded-2xl bg-white/5"><img src="' + escapeHtml(getCheckoutImage(product)) + '" alt="' + escapeHtml(product.title || 'Produto') + '" class="h-full w-full object-contain" /></div></div>'
      + '<div class="space-y-3">'
      + renderInput({ label: 'Arquivo / URL da foto do checkout', field: 'checkout.image', value: product.checkout.image, hint: 'Se estiver vazio, o checkout usa a primeira foto da galeria.' })
      + renderInput({ label: 'Arquivo / URL do QR Code customizado', field: 'pix.qrcode_url', value: product.pix.qrcode_url || '', hint: 'Opcional. Se estiver vazio, o QR pode ser gerado pelo codigo PIX.' })
      + '</div>'
      + '</div>'
      + '</div>'
      + '</div>';
  }

  function renderReviewCard(bucket, review, index) {
    const avatarPreview = hasText(review.avatar)
      ? '<img src="' + escapeHtml(review.avatar) + '" alt="' + escapeHtml(review.name || 'Avatar') + '" class="h-full w-full object-cover" />'
      : '<div class="flex h-full w-full items-center justify-center text-lg font-extrabold text-white" style="background:' + escapeHtml(review.avatar_color || '#22c55e') + ';">' + escapeHtml((review.name || 'C').trim().charAt(0).toUpperCase()) + '</div>';

    return ''
      + '<div class="rounded-3xl border border-white/10 bg-slate-950/60 p-4">'
      + '<div class="flex flex-wrap items-start justify-between gap-3">'
      + '<div class="text-sm font-bold text-white">Avaliacao ' + (index + 1) + '</div>'
      + '<div class="flex flex-wrap gap-2">'
      + '<button type="button" data-action="move-review" data-bucket="' + escapeHtml(bucket) + '" data-index="' + index + '" data-delta="-1" class="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-200 transition hover:bg-white/10">Subir</button>'
      + '<button type="button" data-action="move-review" data-bucket="' + escapeHtml(bucket) + '" data-index="' + index + '" data-delta="1" class="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-200 transition hover:bg-white/10">Descer</button>'
      + '<button type="button" data-action="duplicate-review" data-bucket="' + escapeHtml(bucket) + '" data-index="' + index + '" class="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-200 transition hover:bg-white/10">Duplicar</button>'
      + '<button type="button" data-action="remove-review" data-bucket="' + escapeHtml(bucket) + '" data-index="' + index + '" class="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-100 transition hover:bg-rose-500/20">Remover</button>'
      + '</div>'
      + '</div>'
      + '<div class="mt-4 grid gap-3 lg:grid-cols-4">'
      + renderInput({ label: 'Nome', field: bucket + '.' + index + '.name', value: review.name })
      + renderInput({ label: 'Data', field: bucket + '.' + index + '.date', type: 'date', value: review.date })
      + renderInput({ label: 'Nota', field: bucket + '.' + index + '.rating', type: 'number', min: '1', max: '5', step: '1', value: review.rating })
      + renderInput({ label: 'Variante', field: bucket + '.' + index + '.variant', value: review.variant })
      + '</div>'
      + '<div class="mt-3">' + renderTextarea({ label: 'Comentario', field: bucket + '.' + index + '.comment', rows: 4, value: review.comment }) + '</div>'
      + '<div class="mt-3 grid gap-4 lg:grid-cols-[200px,minmax(0,1fr)]">'
      + '<div class="rounded-3xl border border-white/10 bg-slate-900/60 p-4">'
      + '<div class="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Avatar</div>'
      + '<div class="mx-auto h-24 w-24 overflow-hidden rounded-full border border-white/10 bg-white/5">' + avatarPreview + '</div>'
      + '<div class="mt-3 flex flex-wrap gap-2">'
      + '<button type="button" data-action="upload-review-avatar" data-bucket="' + escapeHtml(bucket) + '" data-index="' + index + '" class="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-200 transition hover:bg-white/10">Upar avatar</button>'
      + '<button type="button" data-action="clear-review-avatar" data-bucket="' + escapeHtml(bucket) + '" data-index="' + index + '" class="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-100 transition hover:bg-rose-500/20">Limpar</button>'
      + '</div>'
      + '<div class="mt-3 space-y-3">'
      + renderInput({ label: 'URL do avatar', field: bucket + '.' + index + '.avatar', value: review.avatar })
      + renderInput({ label: 'Cor do avatar', field: bucket + '.' + index + '.avatar_color', type: 'color', value: review.avatar_color, className: 'h-12 w-full rounded-2xl border border-white/10 bg-slate-950 px-2 py-2' })
      + '</div>'
      + '</div>'
      + '<div class="space-y-3">'
      + '<div class="rounded-3xl border border-white/10 bg-slate-900/60 p-4">'
      + '<div class="flex flex-wrap items-start justify-between gap-2">'
      + '<div><div class="text-sm font-bold text-white">Fotos desta avaliacao</div><p class="mt-1 text-xs text-slate-500">Uma URL por linha. Tambem pode enviar direto pelo painel.</p></div>'
      + '<button type="button" data-action="upload-review-images" data-bucket="' + escapeHtml(bucket) + '" data-index="' + index + '" class="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-200 transition hover:bg-white/10">Upar fotos</button>'
      + '</div>'
      + '<div class="mt-3 grid gap-2 sm:grid-cols-3">'
      + ((review.images || []).length
        ? review.images.map(function (image) {
            return '<div class="overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-2"><img src="' + escapeHtml(image) + '" alt="" class="h-24 w-full object-cover" /></div>';
          }).join('')
        : '<div class="rounded-2xl border border-dashed border-white/10 bg-slate-950/40 px-4 py-6 text-center text-xs text-slate-500 sm:col-span-3">Sem fotos nesta avaliacao.</div>')
      + '</div>'
      + '<div class="mt-3">' + renderTextarea({ label: 'URLs das fotos', linesField: bucket + '.' + index + '.images', rows: 5, value: (review.images || []).join('\n') }) + '</div>'
      + '</div>'
      + '</div>'
      + '</div>'
      + '</div>';
  }

  function renderReviewBucket(product, bucket, title, description) {
    const reviews = product[bucket] || [];
    return ''
      + '<div class="' + PANEL_CLASS + '">'
      + '<div class="flex flex-wrap items-start justify-between gap-3">'
      + '<div><div class="text-sm font-extrabold text-white">' + escapeHtml(title) + '</div><p class="mt-1 text-sm text-slate-400">' + escapeHtml(description) + '</p></div>'
      + '<div class="flex flex-wrap gap-2">'
      + '<button type="button" data-action="open-review-import" data-bucket="' + escapeHtml(bucket) + '" class="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-slate-200 transition hover:bg-white/10">Importar</button>'
      + '<button type="button" data-action="add-review" data-bucket="' + escapeHtml(bucket) + '" class="rounded-2xl bg-emerald-400 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-300">Nova avaliacao</button>'
      + '</div>'
      + '</div>'
      + '<div class="mt-4 space-y-4">'
      + (reviews.length ? reviews.map(function (review, index) { return renderReviewCard(bucket, review, index); }).join('') : '<div class="rounded-3xl border border-dashed border-white/15 bg-slate-950/40 p-8 text-center text-sm text-slate-400">Nenhuma avaliacao cadastrada nesta lista ainda.</div>')
      + '</div>'
      + '</div>';
  }

  function renderReviewsTab(product) {
    return ''
      + '<div class="space-y-4">'
      + '<div class="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">Edite uma a uma, duplique as melhores ou importe varias de uma vez em JSON. O painel atualiza a contagem de avaliacoes cadastradas automaticamente.</div>'
      + renderReviewBucket(product, 'visible_reviews', 'Avaliacoes visiveis', 'Essas aparecem primeiro na LP, perto do topo da prova social.')
      + renderReviewBucket(product, 'extra_reviews', 'Avaliacoes extras', 'Essas alimentam a lista mais longa de comentarios e fotos.')
      + '</div>';
  }

  function renderBulletCard(bullet, index) {
    return ''
      + '<div class="rounded-3xl border border-white/10 bg-slate-950/60 p-4">'
      + '<div class="flex flex-wrap items-start justify-between gap-3">'
      + '<div class="text-sm font-bold text-white">Destaque ' + (index + 1) + '</div>'
      + '<div class="flex flex-wrap gap-2">'
      + '<button type="button" data-action="move-bullet" data-index="' + index + '" data-delta="-1" class="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-200 transition hover:bg-white/10">Subir</button>'
      + '<button type="button" data-action="move-bullet" data-index="' + index + '" data-delta="1" class="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-200 transition hover:bg-white/10">Descer</button>'
      + '<button type="button" data-action="remove-bullet" data-index="' + index + '" class="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-100 transition hover:bg-rose-500/20">Remover</button>'
      + '</div>'
      + '</div>'
      + '<div class="mt-4 grid gap-3 md:grid-cols-3">'
      + renderInput({ label: 'Icone / codigo', field: 'description.bullets.' + index + '.icon', value: bullet.icon })
      + renderInput({ label: 'Titulo', field: 'description.bullets.' + index + '.title', value: bullet.title, wrapperClass: 'block text-sm md:col-span-2' })
      + '</div>'
      + '<div class="mt-3">' + renderTextarea({ label: 'Texto', field: 'description.bullets.' + index + '.text', rows: 3, value: bullet.text }) + '</div>'
      + '</div>';
  }

  function renderLpTab(product) {
    return ''
      + '<div class="grid gap-4 xl:grid-cols-2">'
      + '<div class="' + PANEL_CLASS + '">'
      + '<div class="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Texto principal da LP</div>'
      + '<div class="grid gap-3">'
      + renderInput({ label: 'Titulo da secao', field: 'description.heading', value: product.description.heading })
      + renderTextarea({ label: 'Descricao da secao', field: 'description.text', rows: 6, value: product.description.text })
      + '<div class="grid gap-3 md:grid-cols-2">'
      + renderInput({ label: 'Titulo da caixa final', field: 'description.info_title', value: product.description.info_title })
      + renderTextarea({ label: 'Texto da caixa final', field: 'description.info_text', rows: 4, value: product.description.info_text })
      + '</div>'
      + '</div>'
      + '</div>'
      + '<div class="' + PANEL_CLASS + '">'
      + '<div class="flex flex-wrap items-start justify-between gap-3">'
      + '<div><div class="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Bullets de destaque</div><p class="mt-2 text-sm text-slate-400">Cada card abaixo vira um destaque da descricao da LP.</p></div>'
      + '<button type="button" data-action="add-bullet" class="rounded-2xl bg-emerald-400 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-300">Novo bullet</button>'
      + '</div>'
      + '<div class="mt-4 space-y-4">'
      + ((product.description.bullets || []).length ? product.description.bullets.map(renderBulletCard).join('') : '<div class="rounded-3xl border border-dashed border-white/15 bg-slate-950/40 p-8 text-center text-sm text-slate-400">Nenhum bullet criado ainda.</div>')
      + '</div>'
      + '</div>'
      + '</div>';
  }

  function renderPaymentStepCard(step, index) {
    return ''
      + '<div class="rounded-3xl border border-white/10 bg-slate-950/60 p-4">'
      + '<div class="flex flex-wrap items-start justify-between gap-3">'
      + '<div class="text-sm font-bold text-white">Passo ' + (index + 1) + '</div>'
      + '<div class="flex flex-wrap gap-2">'
      + '<button type="button" data-action="move-payment-step" data-index="' + index + '" data-delta="-1" class="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-200 transition hover:bg-white/10">Subir</button>'
      + '<button type="button" data-action="move-payment-step" data-index="' + index + '" data-delta="1" class="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-200 transition hover:bg-white/10">Descer</button>'
      + '<button type="button" data-action="remove-payment-step" data-index="' + index + '" class="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-100 transition hover:bg-rose-500/20">Remover</button>'
      + '</div>'
      + '</div>'
      + '<div class="mt-4 grid gap-3">'
      + renderInput({ label: 'Titulo', field: 'checkout.payment_instructions.' + index + '.title', value: step.title })
      + renderTextarea({ label: 'Descricao', field: 'checkout.payment_instructions.' + index + '.desc', rows: 3, value: step.desc })
      + '</div>'
      + '</div>';
  }

  function renderCheckoutTab(product) {
    return ''
      + '<div class="grid gap-4 xl:grid-cols-2">'
      + '<div class="' + PANEL_CLASS + '">'
      + '<div class="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Textos do checkout</div>'
      + '<div class="grid gap-3 md:grid-cols-2">'
      + renderInput({ label: 'Badge da oferta', field: 'checkout.offer_badge', value: product.checkout.offer_badge })
      + renderInput({ label: 'Texto do botao', field: 'checkout.submit_label', value: product.checkout.submit_label })
      + '</div>'
      + '<div class="mt-3 grid gap-3 md:grid-cols-2">'
      + renderInput({ label: 'Titulo da garantia', field: 'checkout.guarantee_title', value: product.checkout.guarantee_title })
      + renderTextarea({ label: 'Texto da garantia', field: 'checkout.guarantee_text', rows: 4, value: product.checkout.guarantee_text })
      + '</div>'
      + '<div class="mt-3 grid gap-3 md:grid-cols-2">'
      + renderInput({ label: 'Titulo do PIX', field: 'checkout.payment_label', value: product.checkout.payment_label })
      + renderInput({ label: 'Badge do PIX', field: 'checkout.payment_badge', value: product.checkout.payment_badge })
      + '</div>'
      + '<div class="mt-3 grid gap-3 md:grid-cols-2">'
      + renderInput({ label: 'Titulo sucesso', field: 'checkout.success_title_template', value: product.checkout.success_title_template })
      + renderTextarea({ label: 'Subtitulo sucesso', field: 'checkout.success_subtitle', rows: 4, value: product.checkout.success_subtitle })
      + '</div>'
      + '<div class="mt-3 grid gap-3 md:grid-cols-2">'
      + renderInput({ label: 'Rodape linha 1', field: 'checkout.footer_primary', value: product.checkout.footer_primary })
      + renderInput({ label: 'Rodape linha 2', field: 'checkout.footer_secondary', value: product.checkout.footer_secondary })
      + '</div>'
      + '</div>'
      + '<div class="' + PANEL_CLASS + '">'
      + '<div class="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Pagamento PIX</div>'
      + renderTextarea({ label: 'Codigo PIX copia e cola', field: 'pix.pix_code', rows: 7, value: product.pix.pix_code })
      + '<div class="mt-3 rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-xs text-slate-400">Se este campo estiver vazio, o checkout nao usa o PIX padrao antigo. Assim evitamos que um produto novo cobre no codigo errado.</div>'
      + '</div>'
      + '</div>'
      + '<div class="mt-4 ' + PANEL_CLASS + '">'
      + '<div class="flex flex-wrap items-start justify-between gap-3">'
      + '<div><div class="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Passos do pagamento</div><p class="mt-2 text-sm text-slate-400">Esses passos aparecem na tela final do checkout, logo abaixo do QR Code.</p></div>'
      + '<button type="button" data-action="add-payment-step" class="rounded-2xl bg-emerald-400 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-300">Novo passo</button>'
      + '</div>'
      + '<div class="mt-4 space-y-4">'
      + ((product.checkout.payment_instructions || []).length ? product.checkout.payment_instructions.map(renderPaymentStepCard).join('') : '<div class="rounded-3xl border border-dashed border-white/15 bg-slate-950/40 p-8 text-center text-sm text-slate-400">Nenhum passo criado ainda.</div>')
      + '</div>'
      + '</div>';
  }

  function renderTrackingTab(product) {
    const pixelReady = hasText(product.tracking.pixel_id);
    const tokenReady = hasText(product.tracking.capi_access_token);
    return ''
      + '<div class="grid gap-4 xl:grid-cols-2">'
      + '<div class="' + PANEL_CLASS + '">'
      + '<div class="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Pixel e CAPI</div>'
      + '<div class="grid gap-3 md:grid-cols-2">'
      + renderInput({ label: 'Pixel ID', field: 'tracking.pixel_id', value: product.tracking.pixel_id })
      + renderInput({ label: 'Nome do CAPI', field: 'tracking.capi_label', value: product.tracking.capi_label, hint: 'Ajuda a organizar os envios na Cloudflare.' })
      + '</div>'
      + '<div class="mt-3">' + renderTextarea({ label: 'Token do CAPI', field: 'tracking.capi_access_token', rows: 5, value: product.tracking.capi_access_token }) + '</div>'
      + '<div class="mt-3 grid gap-3 md:grid-cols-2">'
      + renderInput({ label: 'Test code do CAPI', field: 'tracking.capi_test_code', value: product.tracking.capi_test_code })
      + renderInput({ label: 'Content ID', field: 'tracking.content_id', value: product.tracking.content_id || product.slug, hint: 'Se deixar vazio, o sistema usa o slug.' })
      + '</div>'
      + '</div>'
      + '<div class="' + PANEL_CLASS + '">'
      + '<div class="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Dados do evento</div>'
      + '<div class="grid gap-3 md:grid-cols-2">'
      + renderInput({ label: 'Content name', field: 'tracking.content_name', value: product.tracking.content_name || product.title })
      + renderInput({ label: 'Content type', field: 'tracking.content_type', value: product.tracking.content_type })
      + '</div>'
      + '<div class="mt-3 grid gap-3 md:grid-cols-3">'
      + renderInput({ label: 'Categoria tracking', field: 'tracking.content_category', value: product.tracking.content_category || product.category })
      + renderInput({ label: 'Moeda', field: 'tracking.currency', value: product.tracking.currency })
      + renderInput({ label: 'Quantidade', field: 'tracking.quantity', type: 'number', step: '1', value: product.tracking.quantity })
      + '</div>'
      + '<div class="mt-4 grid gap-3 md:grid-cols-2">'
      + renderBadge('Pixel', pixelReady ? 'Configurado' : 'Pendente', pixelReady ? 'ok' : 'warn')
      + renderBadge('CAPI token', tokenReady ? 'Configurado' : 'Pendente', tokenReady ? 'ok' : 'warn')
      + '</div>'
      + '</div>'
      + '</div>';
  }

  function renderEditor() {
    const root = $('productEditor');
    const product = getCurrentProduct();
    if (!root) return;
    if (!product) {
      root.innerHTML = '<div class="rounded-3xl border border-dashed border-white/15 bg-slate-950/40 p-8 text-center text-sm text-slate-400">Nenhum produto selecionado.</div>';
      return;
    }

    if (state.currentProductTab === 'overview') root.innerHTML = renderOverviewTab(product);
    else if (state.currentProductTab === 'media') root.innerHTML = renderMediaTab(product);
    else if (state.currentProductTab === 'reviews') root.innerHTML = renderReviewsTab(product);
    else if (state.currentProductTab === 'lp') root.innerHTML = renderLpTab(product);
    else if (state.currentProductTab === 'checkout') root.innerHTML = renderCheckoutTab(product);
    else root.innerHTML = renderTrackingTab(product);
  }

  function setSection(section) {
    state.currentSection = section;
    document.querySelectorAll('.admin-section').forEach(function (panel) {
      panel.classList.toggle('hidden', panel.id !== 'section-' + section);
    });
    document.querySelectorAll('.nav-button').forEach(function (button) {
      const active = button.getAttribute('data-section') === section;
      button.classList.toggle('border-emerald-500/30', active);
      button.classList.toggle('bg-emerald-500/15', active);
      button.classList.toggle('text-emerald-200', active);
      button.classList.toggle('border-white/10', !active);
      button.classList.toggle('bg-white/5', !active);
      button.classList.toggle('text-slate-300', !active);
    });
  }

  function selectProduct(index) {
    if (!state.store || !state.store.products[index]) return;
    state.currentIndex = index;
    renderProductList();
    renderProductHeader();
    renderProductTabs();
    renderEditor();
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
    state.store = hydrateStore(data.store);
    const defaultIndex = state.store.products.findIndex(function (product) {
      return product.slug === state.store.default_product_slug;
    });
    state.currentIndex = defaultIndex >= 0 ? defaultIndex : 0;
  }

  async function saveStore() {
    const product = getCurrentProduct();
    const currentSlug = product ? product.slug : '';
    const response = await fetch('/api/store-admin', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        default_product_slug: state.store.default_product_slug,
        products: serializeProducts(),
      }),
    });
    const data = await response.json();
    if (!response.ok || !data || !data.ok || !data.store) throw new Error('Nao foi possivel salvar os produtos.');
    state.store = hydrateStore(data.store);
    const nextIndex = state.store.products.findIndex(function (item) { return item.slug === currentSlug; });
    state.currentIndex = nextIndex >= 0 ? nextIndex : 0;
    renderProductList();
    renderProductHeader();
    renderProductTabs();
    renderEditor();
    renderMetrics();
    clearDirty('Produtos salvos com sucesso.');
  }

  async function initialize() {
    await Promise.all([loadStore(), loadOrders(), loadMetrics()]);
    renderMetrics();
    renderOrders();
    renderProductList();
    renderProductHeader();
    renderProductTabs();
    renderEditor();
    setSection(state.currentSection);
  }

  function openAssetPicker(context, multiple) {
    state.uploadContext = context;
    const picker = $('assetPicker');
    if (!picker) return;
    picker.multiple = !!multiple;
    picker.value = '';
    picker.click();
  }

  function readFileAsDataUrl(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function () { resolve(String(reader.result || '')); };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function loadImage(src) {
    return new Promise(function (resolve, reject) {
      const image = new Image();
      image.onload = function () { resolve(image); };
      image.onerror = reject;
      image.src = src;
    });
  }

  async function optimizeImageFile(file, options) {
    const settings = Object.assign({
      maxWidth: 1400,
      maxHeight: 1400,
      quality: 0.84,
      type: 'image/webp',
    }, options || {});

    const fallback = await readFileAsDataUrl(file);
    if (!file || !String(file.type || '').startsWith('image/')) return fallback;

    let objectUrl = '';
    try {
      objectUrl = URL.createObjectURL(file);
      const image = await loadImage(objectUrl);
      const width = image.naturalWidth || image.width;
      const height = image.naturalHeight || image.height;
      if (!width || !height) return fallback;

      const ratio = Math.min(1, settings.maxWidth / width, settings.maxHeight / height);
      const targetWidth = Math.max(1, Math.round(width * ratio));
      const targetHeight = Math.max(1, Math.round(height * ratio));

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const context = canvas.getContext('2d');
      if (!context) return fallback;
      context.drawImage(image, 0, 0, targetWidth, targetHeight);
      return canvas.toDataURL(settings.type, settings.quality);
    } catch (error) {
      return fallback;
    } finally {
      if (objectUrl) {
        try { URL.revokeObjectURL(objectUrl); } catch (error) {}
      }
    }
  }

  async function handleAssetSelection(event) {
    const files = Array.from(event.target.files || []);
    const product = getCurrentProduct();
    const context = state.uploadContext;
    state.uploadContext = null;
    if (!product || !context || !files.length) return;

    setStatus('Otimizando imagens para o painel...', 'warn');

    const options = context.kind === 'review-avatar'
      ? { maxWidth: 360, maxHeight: 360, quality: 0.88 }
      : context.kind === 'review-images'
        ? { maxWidth: 1000, maxHeight: 1000, quality: 0.84 }
        : context.kind === 'checkout-image'
          ? { maxWidth: 900, maxHeight: 900, quality: 0.86 }
          : { maxWidth: 1600, maxHeight: 1600, quality: 0.84 };

    const processed = await Promise.all(files.map(function (file) {
      return optimizeImageFile(file, options);
    }));

    if (context.kind === 'gallery-add') {
      processed.forEach(function (src, uploadIndex) {
        product.images.push({
          src: src,
          thumbnail: src,
          alt: product.title + ' imagem ' + (product.images.length + uploadIndex + 1),
        });
      });
      if (!hasText(product.checkout.image) && product.images[0] && hasText(product.images[0].src)) {
        product.checkout.image = product.images[0].src;
      }
      renderEditor();
      renderProductSummary(product);
      renderProductList();
      markDirty('Fotos da LP adicionadas ao produto.');
      return;
    }

    if (context.kind === 'gallery-replace') {
      const current = product.images[context.index];
      if (current) {
        current.src = processed[0] || current.src;
        current.thumbnail = processed[0] || current.thumbnail;
      }
      renderEditor();
      renderProductSummary(product);
      renderProductList();
      markDirty('Imagem da galeria atualizada.');
      return;
    }

    if (context.kind === 'checkout-image') {
      product.checkout.image = processed[0] || '';
      renderEditor();
      renderProductSummary(product);
      renderProductList();
      markDirty('Foto do checkout atualizada.');
      return;
    }

    if (context.kind === 'review-avatar') {
      const review = product[context.bucket] && product[context.bucket][context.index];
      if (review) review.avatar = processed[0] || '';
      renderEditor();
      renderProductSummary(product);
      markDirty('Avatar da avaliacao atualizado.');
      return;
    }

    if (context.kind === 'review-images') {
      const review = product[context.bucket] && product[context.bucket][context.index];
      if (review) review.images = (review.images || []).concat(processed.filter(Boolean));
      renderEditor();
      renderProductSummary(product);
      markDirty('Fotos da avaliacao adicionadas.');
    }
  }

  function openReviewImport(bucket) {
    $('reviewImportTarget').value = bucket || 'visible_reviews';
    $('reviewImportMode').value = 'append';
    $('reviewImportText').value = '';
    $('reviewImportTitle').textContent = bucket === 'extra_reviews'
      ? 'Importar avaliacoes extras'
      : 'Importar avaliacoes visiveis';
    const modal = $('reviewImportModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  function closeReviewImport() {
    const modal = $('reviewImportModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }

  function extractImportedReviews(payload, bucket) {
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload[bucket])) return payload[bucket];
    if (payload && Array.isArray(payload.reviews)) return payload.reviews;
    if (payload && Array.isArray(payload.items)) return payload.items;
    throw new Error('Cole um array JSON de avaliacoes ou um objeto com a lista.');
  }

  function importReviews() {
    const product = getCurrentProduct();
    if (!product) throw new Error('Nenhum produto selecionado.');

    const bucket = $('reviewImportTarget').value || 'visible_reviews';
    const mode = $('reviewImportMode').value || 'append';
    const rawText = $('reviewImportText').value.trim();
    if (!rawText) throw new Error('Cole o JSON das avaliacoes para importar.');

    let parsed = null;
    try {
      parsed = JSON.parse(rawText);
    } catch (error) {
      throw new Error('JSON invalido. Revise o conteudo colado.');
    }

    const imported = extractImportedReviews(parsed, bucket).map(function (item, index) {
      return hydrateReview(item, index);
    });

    if (mode === 'replace') product[bucket] = imported;
    else product[bucket] = (product[bucket] || []).concat(imported);

    syncReviewCount(product);
    closeReviewImport();
    renderEditor();
    renderProductSummary(product);
    renderProductList();
    markDirty('Avaliacoes importadas com sucesso.');
  }

  function onEditorInput(event) {
    const product = getCurrentProduct();
    const target = event.target;
    if (!product || !target) return;

    if (target.dataset.action === 'toggle-default' && target.type === 'checkbox') {
      if (target.checked) state.store.default_product_slug = product.slug;
      else {
        const fallback = state.store.products.find(function (item, index) { return index !== state.currentIndex; }) || product;
        state.store.default_product_slug = fallback.slug;
      }
      renderProductList();
      renderProductHeader();
      renderEditor();
      markDirty('Produto padrao atualizado.');
      return;
    }

    if (target.dataset.linesField) {
      setByPath(product, target.dataset.linesField, splitLines(target.value));
      renderProductSummary(product);
      markDirty();
      return;
    }

    if (!target.dataset.field) return;

    const field = target.dataset.field;
    const oldSlug = product.slug;
    let value;

    if (target.type === 'checkbox') value = target.checked;
    else if (target.type === 'number') value = target.value === '' ? 0 : Number(target.value);
    else value = target.value;

    if (field === 'slug') {
      value = slugify(value);
      target.value = value;
      product.__manualSlug = true;
    }

    setByPath(product, field, value);

    if (field === 'title' && !product.__manualSlug) {
      product.slug = slugify(product.title);
      const slugInput = document.querySelector('[data-field="slug"]');
      if (slugInput) slugInput.value = product.slug;
    }

    if (field === 'title' && !hasText(product.tracking.content_name)) product.tracking.content_name = product.title;
    if (field === 'category' && !hasText(product.tracking.content_category)) product.tracking.content_category = product.category;
    if ((field === 'title' || field === 'slug') && !hasText(product.tracking.content_id)) product.tracking.content_id = product.slug;
    if ((field === 'title' || field === 'slug') && !hasText(product.tracking.capi_label)) product.tracking.capi_label = product.slug;
    if (oldSlug !== product.slug && state.store.default_product_slug === oldSlug) state.store.default_product_slug = product.slug;

    renderProductHeader();
    if (/^(title|slug|active|prices\.landing|prices\.checkout|prices\.original)$/.test(field)) renderProductList();
    markDirty();
  }

  function onProductListClick(event) {
    const button = event.target.closest('[data-action="select-product"]');
    if (!button) return;
    selectProduct(Number(button.getAttribute('data-index')));
  }

  function onTabsClick(event) {
    const button = event.target.closest('[data-action="switch-product-tab"]');
    if (!button) return;
    state.currentProductTab = button.getAttribute('data-tab') || 'overview';
    renderProductTabs();
    renderEditor();
  }

  function onEditorClick(event) {
    const button = event.target.closest('[data-action]');
    const product = getCurrentProduct();
    if (!button || !product) return;

    const action = button.getAttribute('data-action');
    const index = Number(button.getAttribute('data-index'));
    const delta = Number(button.getAttribute('data-delta') || 0);
    const bucket = button.getAttribute('data-bucket');

    if (action === 'add-gallery-image') {
      product.images.push(hydrateImage({}, product.images.length, product.title));
      renderEditor();
      markDirty('Espaco para nova imagem criado.');
      return;
    }

    if (action === 'upload-gallery-images') {
      openAssetPicker({ kind: 'gallery-add' }, true);
      return;
    }

    if (action === 'replace-gallery-image') {
      openAssetPicker({ kind: 'gallery-replace', index: index }, false);
      return;
    }

    if (action === 'move-gallery-image') {
      moveItem(product.images, index, delta);
      renderEditor();
      renderProductSummary(product);
      renderProductList();
      markDirty('Ordem das imagens atualizada.');
      return;
    }

    if (action === 'remove-gallery-image') {
      product.images.splice(index, 1);
      if (product.checkout.image && product.images.every(function (item) { return item.src !== product.checkout.image; })) {
        product.checkout.image = product.images[0] && product.images[0].src ? product.images[0].src : '';
      }
      renderEditor();
      renderProductSummary(product);
      renderProductList();
      markDirty('Imagem removida da galeria.');
      return;
    }

    if (action === 'set-checkout-image-from-gallery') {
      const image = product.images[index];
      product.checkout.image = image && image.src ? image.src : '';
      renderEditor();
      renderProductSummary(product);
      renderProductList();
      markDirty('Foto do checkout atualizada a partir da galeria.');
      return;
    }

    if (action === 'upload-checkout-image') {
      openAssetPicker({ kind: 'checkout-image' }, false);
      return;
    }

    if (action === 'use-first-gallery-as-checkout') {
      product.checkout.image = product.images[0] && product.images[0].src ? product.images[0].src : '';
      renderEditor();
      renderProductSummary(product);
      renderProductList();
      markDirty('Checkout configurado para usar a primeira foto da LP.');
      return;
    }

    if (action === 'clear-checkout-image') {
      product.checkout.image = '';
      renderEditor();
      renderProductSummary(product);
      renderProductList();
      markDirty('Foto exclusiva do checkout removida.');
      return;
    }

    if (action === 'add-review') {
      product[bucket].push(hydrateReview({}, product[bucket].length));
      syncReviewCount(product);
      renderEditor();
      renderProductSummary(product);
      renderProductList();
      markDirty('Nova avaliacao criada.');
      return;
    }

    if (action === 'duplicate-review') {
      const current = product[bucket][index];
      if (!current) return;
      product[bucket].splice(index + 1, 0, hydrateReview(current, index + 1));
      syncReviewCount(product);
      renderEditor();
      renderProductSummary(product);
      renderProductList();
      markDirty('Avaliacao duplicada.');
      return;
    }

    if (action === 'remove-review') {
      product[bucket].splice(index, 1);
      syncReviewCount(product);
      renderEditor();
      renderProductSummary(product);
      renderProductList();
      markDirty('Avaliacao removida.');
      return;
    }

    if (action === 'move-review') {
      moveItem(product[bucket], index, delta);
      renderEditor();
      renderProductSummary(product);
      markDirty('Ordem das avaliacoes atualizada.');
      return;
    }

    if (action === 'open-review-import') {
      openReviewImport(bucket);
      return;
    }

    if (action === 'upload-review-avatar') {
      openAssetPicker({ kind: 'review-avatar', bucket: bucket, index: index }, false);
      return;
    }

    if (action === 'clear-review-avatar') {
      if (product[bucket] && product[bucket][index]) product[bucket][index].avatar = '';
      renderEditor();
      markDirty('Avatar da avaliacao limpo.');
      return;
    }

    if (action === 'upload-review-images') {
      openAssetPicker({ kind: 'review-images', bucket: bucket, index: index }, true);
      return;
    }

    if (action === 'add-bullet') {
      product.description.bullets.push(hydrateBullet({}, product.description.bullets.length));
      renderEditor();
      markDirty('Novo bullet criado.');
      return;
    }

    if (action === 'move-bullet') {
      moveItem(product.description.bullets, index, delta);
      renderEditor();
      markDirty('Ordem dos bullets atualizada.');
      return;
    }

    if (action === 'remove-bullet') {
      product.description.bullets.splice(index, 1);
      renderEditor();
      markDirty('Bullet removido.');
      return;
    }

    if (action === 'add-payment-step') {
      product.checkout.payment_instructions.push(hydratePaymentStep({}, product.checkout.payment_instructions.length));
      renderEditor();
      markDirty('Novo passo de pagamento criado.');
      return;
    }

    if (action === 'move-payment-step') {
      moveItem(product.checkout.payment_instructions, index, delta);
      renderEditor();
      markDirty('Ordem dos passos atualizada.');
      return;
    }

    if (action === 'remove-payment-step') {
      product.checkout.payment_instructions.splice(index, 1);
      renderEditor();
      markDirty('Passo de pagamento removido.');
    }
  }

  function bindStaticEvents() {
    document.querySelectorAll('.nav-button').forEach(function (button) {
      button.addEventListener('click', function () {
        setSection(button.getAttribute('data-section') || 'dashboard');
      });
    });

    $('productList').addEventListener('click', onProductListClick);
    $('productTabs').addEventListener('click', onTabsClick);
    $('productEditor').addEventListener('input', onEditorInput);
    $('productEditor').addEventListener('change', onEditorInput);
    $('productEditor').addEventListener('click', onEditorClick);
    $('assetPicker').addEventListener('change', handleAssetSelection);

    $('newProduct').addEventListener('click', function () {
      const product = hydrateProduct(buildBlankProductSeed());
      product.__manualSlug = false;
      state.store.products.unshift(product);
      state.currentIndex = 0;
      renderProductList();
      renderProductHeader();
      renderProductTabs();
      renderEditor();
      setSection('products');
      markDirty('Novo produto criado. Complete os dados e salve para publicar.');
    });

    $('duplicateProduct').addEventListener('click', function () {
      const current = getCurrentProduct();
      if (!current) return;
      const copy = hydrateProduct(current);
      copy.slug = slugify(current.slug + '-copy-' + Date.now().toString(36).slice(-4));
      copy.title = (current.title || 'Produto') + ' (Copia)';
      copy.is_default = false;
      copy.pix.pix_code = '';
      copy.pix.qrcode_url = '';
      copy.tracking.pixel_id = '';
      copy.tracking.capi_access_token = '';
      copy.tracking.capi_test_code = '';
      copy.tracking.capi_label = copy.slug;
      copy.tracking.content_id = copy.slug;
      copy.tracking.content_name = copy.title;
      copy.__manualSlug = true;
      state.store.products.unshift(copy);
      state.currentIndex = 0;
      renderProductList();
      renderProductHeader();
      renderProductTabs();
      renderEditor();
      setSection('products');
      markDirty('Produto duplicado. PIX, pixel e token foram limpos para evitar heranca indevida.');
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
      if (state.store.default_product_slug === current.slug) state.store.default_product_slug = state.store.products[0].slug;
      state.currentIndex = 0;
      renderProductList();
      renderProductHeader();
      renderProductTabs();
      renderEditor();
      markDirty('Produto removido do catalogo. Salve para publicar.');
    });

    $('saveProducts').addEventListener('click', async function () {
      setStatus('Salvando produtos...', 'warn');
      try {
        await saveStore();
      } catch (error) {
        console.error(error);
        setStatus(error.message || 'Falha ao salvar os produtos.', 'error');
      }
    });

    $('refreshData').addEventListener('click', async function () {
      setStatus('Recarregando dados...', 'warn');
      try {
        await initialize();
        clearDirty('Dados atualizados.');
      } catch (error) {
        console.error(error);
        setStatus(error.message || 'Falha ao recarregar dados.', 'error');
      }
    });

    $('openLanding').addEventListener('click', function () {
      const product = getCurrentProduct();
      if (!product) return;
      window.open(getProductLinks(product).landing, '_blank');
    });

    $('openCheckout').addEventListener('click', function () {
      const product = getCurrentProduct();
      if (!product) return;
      window.open(getProductLinks(product).checkout, '_blank');
    });

    $('closeReviewImport').addEventListener('click', closeReviewImport);
    $('submitReviewImport').addEventListener('click', function () {
      try {
        importReviews();
      } catch (error) {
        setStatus(error.message || 'Falha ao importar avaliacoes.', 'error');
      }
    });

    $('reviewImportModal').addEventListener('click', function (event) {
      if (event.target === $('reviewImportModal')) closeReviewImport();
    });
  }

  bindStaticEvents();

  initialize()
    .then(function () {
      clearDirty('Painel carregado.');
    })
    .catch(function (error) {
      console.error(error);
      setStatus(error.message || 'Falha ao carregar o painel.', 'error');
    });
})();
