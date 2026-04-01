(function () {
  const DEFAULT_PRODUCT = {
    slug: 'fritadeira-eletrica-forno-oven-12l',
    title: 'Fritadeira Eletrica Forno Oven 12L Mondial AFON-12L-BI',
    short_description:
      'Air Fryer + Forno em um unico aparelho. Economize 50% hoje com frete gratis e envio rapido.',
    seo_description:
      'Fritadeira Eletrica Forno Oven 12L Mondial AFON-12L-BI. Oferta especial com frete gratis e pagamento via PIX.',
    category: 'Eletroportateis',
    variant_label: 'Preto - 12 Litros',
    prices: {
      original: 399.9,
      landing: 197.99,
      checkout: 197.99,
      discount_badge: 'Desconto de 50%',
      discount_text: 'Economize R$ 201,91',
    },
    stats: {
      rating_value: 4.9,
      rating_count: 591,
      sold_count: 8473,
      review_count: 95,
      rating_breakdown: [
        { stars: 5, count: 44 },
        { stars: 4, count: 14 },
        { stars: 3, count: 0 },
        { stars: 2, count: 0 },
        { stars: 1, count: 0 },
      ],
    },
    images: [
      { src: '/assets/img/01.webp', thumbnail: '/assets/img/thumb_01.webp', alt: 'Foto principal do produto' },
      { src: '/assets/img/02.webp', thumbnail: '/assets/img/thumb_02.webp', alt: 'Foto lateral do produto' },
      { src: '/assets/img/03.webp', thumbnail: '/assets/img/thumb_03.webp', alt: 'Detalhe do produto' },
      { src: '/assets/img/04.webp', thumbnail: '/assets/img/thumb_04.webp', alt: 'Detalhe do produto' },
      { src: '/assets/img/05.webp', thumbnail: '/assets/img/thumb_05.webp', alt: 'Detalhe do produto' },
      { src: '/assets/img/06.webp', thumbnail: '/assets/img/thumb_06.webp', alt: 'Detalhe do produto' },
      { src: '/assets/img/07.webp', thumbnail: '/assets/img/thumb_07.webp', alt: 'Detalhe do produto' },
      { src: '/assets/img/08.webp', thumbnail: '/assets/img/thumb_08.webp', alt: 'Detalhe do produto' },
    ],
    visible_reviews: [],
    extra_reviews: [],
    description: {
      heading: 'Sobre o produto',
      text:
        'Air Fryer + Forno em um unico aparelho. Asse, cozinhe e frite sem oleo com a praticidade e o espaco que a sua cozinha precisa.',
      bullets: [],
      info_title: 'Informacoes',
      info_text:
        'Pagamento processado com seguranca. 1 ano de garantia do fabricante e envio para todo o Brasil.',
    },
    checkout: {
      image: '/assets/img/01.webp',
      offer_badge: 'OFERTA TIKTOK',
      guarantee_title: 'Satisfacao garantida',
      guarantee_text: 'Se nao gostar, devolvemos seu dinheiro em ate 7 dias. Sem burocracia.',
      submit_label: 'FINALIZAR COM DESCONTO',
      success_title_template: 'Quase la, {firstName}!',
      success_subtitle: 'Finalize o pagamento para garantir a oferta.',
      payment_label: 'PIX',
      payment_badge: 'Aprovacao imediata',
      payment_instructions: [
        { title: 'Copie o codigo', desc: 'Clique no botao acima para copiar o codigo PIX.' },
        { title: 'Abra o app do banco', desc: 'Acesse o aplicativo do seu banco ou fintech.' },
        { title: 'Pix Copia e Cola', desc: 'Escolha a opcao PIX e cole o codigo copiado.' },
        { title: 'Confirme o pagamento', desc: 'Revise os dados e confirme. A aprovacao e automatica.' },
      ],
      footer_primary: 'Compra processada por Izzat (c) 2026',
      footer_secondary: 'Todos os direitos reservados',
    },
    pix: {
      pix_code:
        '00020101021226900014br.gov.bcb.pix2568pix.adyen.com/pixqrcodelocation/pixloc/v1/loc/hWu3o18RS3OOujzeqNF5iQ5204000053039865802BR5925MONETIZZE IMPULSIONADORA 6009SAO PAULO62070503***63047984',
      qrcode_url: '/assets/img/qrcode.webp',
    },
    tracking: {
      pixel_id: 'D6VVDPJC77UANC7P0IT0',
      capi_label: 'fritadeira-12l',
      content_id: 'AFON-12L-BI',
      content_name: 'Fritadeira Eletrica Forno Oven 12L Mondial AFON-12L-BI',
      content_type: 'product',
      content_category: 'Eletroportateis',
      currency: 'BRL',
      quantity: 1,
    },
  };

  function hasText(value) {
    return typeof value === 'string' && value.trim().length > 0;
  }

  function normalizeNumber(value, fallback) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const normalized = Number(String(value).replace(',', '.'));
      if (Number.isFinite(normalized)) return normalized;
    }
    return fallback;
  }

  function normalizePath(value, fallback) {
    if (!hasText(value)) return fallback || '';
    const trimmed = value.trim();
    if (/^(?:\/+)?(?:data|blob):/i.test(trimmed)) {
      return trimmed.replace(/^\/+(?=(?:data|blob):)/i, '');
    }
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return trimmed.startsWith('/') ? trimmed : `/${trimmed.replace(/^\/+/, '')}`;
  }

  function buildLinks(slug) {
    const safeSlug = hasText(slug) ? slug.trim().toLowerCase() : DEFAULT_PRODUCT.slug;
    return {
      landing_path: `/p/${encodeURIComponent(safeSlug)}`,
      checkout_path: `/c/${encodeURIComponent(safeSlug)}`,
      query_landing_path: `/?product=${encodeURIComponent(safeSlug)}`,
      query_checkout_path: `/c/?product=${encodeURIComponent(safeSlug)}`,
    };
  }

  function buildTrackingContent(product) {
    const price = normalizeNumber(
      product && product.prices ? (product.prices.checkout || product.prices.landing) : DEFAULT_PRODUCT.prices.checkout,
      DEFAULT_PRODUCT.prices.checkout
    );
    const contentId = product && product.tracking && hasText(product.tracking.content_id)
      ? product.tracking.content_id.trim()
      : DEFAULT_PRODUCT.tracking.content_id;
    const contentName = product && product.tracking && hasText(product.tracking.content_name)
      ? product.tracking.content_name.trim()
      : (product && product.title ? product.title : DEFAULT_PRODUCT.title);
    const quantity = product && product.tracking
      ? Math.max(1, Math.round(normalizeNumber(product.tracking.quantity, 1)))
      : 1;

    return {
      content_type: product && product.tracking && hasText(product.tracking.content_type)
        ? product.tracking.content_type.trim()
        : DEFAULT_PRODUCT.tracking.content_type,
      contents: [{
        content_id: contentId,
        id: contentId,
        quantity: quantity,
        price: price,
        item_price: price,
      }],
      content_id: contentId,
      content_ids: [contentId],
      content_name: contentName,
      description: product && product.short_description ? product.short_description : DEFAULT_PRODUCT.short_description,
      content_category: product && product.tracking && hasText(product.tracking.content_category)
        ? product.tracking.content_category.trim()
        : (product && product.category ? product.category : DEFAULT_PRODUCT.category),
      quantity: quantity,
      price: price,
      value: price,
      currency: product && product.tracking && hasText(product.tracking.currency)
        ? product.tracking.currency.trim().toUpperCase()
        : DEFAULT_PRODUCT.tracking.currency,
    };
  }

  function normalizeProduct(product) {
    const raw = product && typeof product === 'object' ? product : {};
    const merged = {
      ...DEFAULT_PRODUCT,
      ...raw,
      prices: {
        ...DEFAULT_PRODUCT.prices,
        ...(raw.prices || {}),
      },
      stats: {
        ...DEFAULT_PRODUCT.stats,
        ...(raw.stats || {}),
      },
      description: {
        ...DEFAULT_PRODUCT.description,
        ...(raw.description || {}),
      },
      checkout: {
        ...DEFAULT_PRODUCT.checkout,
        ...(raw.checkout || {}),
      },
      pix: {
        ...DEFAULT_PRODUCT.pix,
        ...(raw.pix || {}),
      },
      tracking: {
        ...DEFAULT_PRODUCT.tracking,
        ...(raw.tracking || {}),
      },
    };

    merged.slug = hasText(merged.slug) ? merged.slug.trim().toLowerCase() : DEFAULT_PRODUCT.slug;
    merged.title = hasText(merged.title) ? merged.title.trim() : DEFAULT_PRODUCT.title;
    merged.short_description = hasText(merged.short_description) ? merged.short_description.trim() : DEFAULT_PRODUCT.short_description;
    merged.seo_description = hasText(merged.seo_description) ? merged.seo_description.trim() : DEFAULT_PRODUCT.seo_description;
    merged.category = hasText(merged.category) ? merged.category.trim() : DEFAULT_PRODUCT.category;
    merged.variant_label = hasText(merged.variant_label) ? merged.variant_label.trim() : DEFAULT_PRODUCT.variant_label;
    merged.prices.original = normalizeNumber(merged.prices.original, DEFAULT_PRODUCT.prices.original);
    merged.prices.landing = normalizeNumber(merged.prices.landing, DEFAULT_PRODUCT.prices.landing);
    merged.prices.checkout = normalizeNumber(merged.prices.checkout, merged.prices.landing);
    merged.images = Array.isArray(merged.images) && merged.images.length
      ? merged.images.map(function (item, index) {
          if (typeof item === 'string') {
            const src = normalizePath(item, '');
            return {
              src: src,
              thumbnail: src,
              alt: merged.title + ' imagem ' + (index + 1),
            };
          }
          return {
            src: normalizePath(item && item.src, normalizePath(item && item.image, DEFAULT_PRODUCT.images[0].src)),
            thumbnail: normalizePath(item && item.thumbnail, normalizePath(item && item.thumb, normalizePath(item && item.src, DEFAULT_PRODUCT.images[0].thumbnail))),
            alt: hasText(item && item.alt) ? item.alt.trim() : (merged.title + ' imagem ' + (index + 1)),
          };
        })
      : DEFAULT_PRODUCT.images.map(function (item) { return { ...item }; });
    merged.checkout.image = hasText(merged.checkout.image)
      ? normalizePath(merged.checkout.image, '')
      : '';
    merged.links = buildLinks(merged.slug);
    return merged;
  }

  function getSlugFromLocation() {
    try {
      const url = new URL(window.location.href);
      const fromQuery = url.searchParams.get('product') || url.searchParams.get('produto');
      if (hasText(fromQuery)) return fromQuery.trim().toLowerCase();

      const pathname = url.pathname || '/';
      let match = pathname.match(/^\/p\/([^/?#]+)/i);
      if (match && hasText(match[1])) return decodeURIComponent(match[1]).toLowerCase();
      match = pathname.match(/^\/c\/([^/?#]+)/i);
      if (match && hasText(match[1])) return decodeURIComponent(match[1]).toLowerCase();
    } catch (error) {}
    return DEFAULT_PRODUCT.slug;
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatCurrencyBRL(value) {
    const amount = normalizeNumber(value, 0);
    return 'R$ ' + amount.toFixed(2).replace('.', ',');
  }

  function applyResolvedProduct(product) {
    const normalized = normalizeProduct(product);
    window.__PRODUCT_CONFIG = normalized;
    window.__PRODUCT_SLUG = normalized.slug;
    window.__PRODUCT_LINKS = normalized.links;
    window.__PRODUCT_LANDING_PATH = normalized.links.landing_path;
    window.__PRODUCT_CHECKOUT_PATH = normalized.links.checkout_path;
    window.PRODUCT_CONTENT = buildTrackingContent(normalized);
    return normalized;
  }

  function notifyReady(product) {
    window.__PRODUCT_CONFIG_READY = true;
    const queue = Array.isArray(window.__productReadyCallbacks) ? window.__productReadyCallbacks.slice() : [];
    window.__productReadyCallbacks = [];
    queue.forEach(function (callback) {
      try { callback(product); } catch (error) {}
    });
  }

  function loadTikTokPixel(pixelId) {
    if (!hasText(pixelId)) return;
    if (window.__loadedProductPixelId === pixelId) return;

    if (!window.ttq) {
      const ttq = [];
      const methods = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie'];
      ttq.setAndDefer = function (target, method) {
        target[method] = function () {
          target.push([method].concat(Array.prototype.slice.call(arguments, 0)));
        };
      };
      for (let i = 0; i < methods.length; i += 1) {
        ttq.setAndDefer(ttq, methods[i]);
      }
      ttq.instance = function (id) {
        const queue = ttq._i[id] || [];
        for (let i = 0; i < methods.length; i += 1) {
          ttq.setAndDefer(queue, methods[i]);
        }
        return queue;
      };
      ttq.load = function (id, opts) {
        const src = 'https://analytics.tiktok.com/i18n/pixel/events.js';
        ttq._i = ttq._i || {};
        ttq._i[id] = [];
        ttq._i[id]._u = src;
        ttq._t = ttq._t || {};
        ttq._t[id] = +new Date();
        ttq._o = ttq._o || {};
        ttq._o[id] = opts || {};

        const script = document.createElement('script');
        script.async = true;
        script.src = src + '?sdkid=' + id + '&lib=ttq';
        const firstScript = document.getElementsByTagName('script')[0];
        if (firstScript && firstScript.parentNode) firstScript.parentNode.insertBefore(script, firstScript);
        else document.head.appendChild(script);
      };
      window.TiktokAnalyticsObject = 'ttq';
      window.ttq = ttq;
    }

    try {
      window.ttq.load(pixelId);
      window.ttq.page();
      window.__loadedProductPixelId = pixelId;
    } catch (error) {}
  }

  window.escapeHtml = window.escapeHtml || escapeHtml;
  window.formatCurrencyBRL = window.formatCurrencyBRL || formatCurrencyBRL;
  window.__buildProductTrackingContent = buildTrackingContent;
  window.__productReadyCallbacks = window.__productReadyCallbacks || [];
  window.__PRODUCT_DEFAULT = normalizeProduct(DEFAULT_PRODUCT);
  window.onProductConfigReady = function (callback) {
    if (typeof callback !== 'function') return;
    if (window.__PRODUCT_CONFIG_READY && window.__PRODUCT_CONFIG) {
      callback(window.__PRODUCT_CONFIG);
      return;
    }
    window.__productReadyCallbacks.push(callback);
  };

  applyResolvedProduct(window.__PRODUCT_DEFAULT);

  const initialSlug = getSlugFromLocation();
  window.__PRODUCT_SLUG = initialSlug;
  window.__PRODUCT_LINKS = buildLinks(initialSlug);
  window.__PRODUCT_LANDING_PATH = window.__PRODUCT_LINKS.landing_path;
  window.__PRODUCT_CHECKOUT_PATH = window.__PRODUCT_LINKS.checkout_path;

  const productPromise = fetch('/api/product-config?slug=' + encodeURIComponent(initialSlug), {
    cache: 'no-store',
    headers: { accept: 'application/json' },
  })
    .then(function (response) {
      if (!response.ok) throw new Error('product_config_http_' + response.status);
      return response.json();
    })
    .then(function (data) {
      if (!data || !data.ok || !data.product) throw new Error('product_config_invalid');
      return applyResolvedProduct(data.product);
    })
    .catch(function (error) {
      console.warn('[product.bootstrap] usando fallback local do produto', error);
      return applyResolvedProduct(DEFAULT_PRODUCT);
    })
    .then(function (product) {
      notifyReady(product);
      const pixelId = product && product.tracking ? product.tracking.pixel_id : '';
      if (!window.__TEST_MODE && !window.__LAB_MODE) loadTikTokPixel(pixelId);
      return product;
    });

  window.getProductConfig = function () {
    return productPromise;
  };
  window.__productConfigPromise = productPromise;
  window.__loadProductPixel = function () {
    return productPromise.then(function (product) {
      const pixelId = product && product.tracking ? product.tracking.pixel_id : '';
      if (!window.__TEST_MODE && !window.__LAB_MODE) loadTikTokPixel(pixelId);
      return product;
    });
  };
})();
