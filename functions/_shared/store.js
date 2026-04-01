const STORE_KEY = 'store_products_v2';
const LEGACY_PIX_KEY = 'pix_config_v1';

const DEFAULT_VISIBLE_REVIEWS = [
  {
    name: 'Fernanda L.',
    date: '2026-03-21',
    rating: 5,
    variant: '12 Litros - Preto',
    comment:
      'Ela e maravilhosa. Ja fiz varios testes e funciona muito bem, com aquecimento forte e rapido. Super indico.',
    avatar: '/assets/img/foto1.webp',
    images: ['/assets/img/review01.webp'],
  },
  {
    name: 'Bruna L.',
    date: '2026-03-20',
    rating: 5,
    variant: '12 Litros - Preto',
    comment:
      'A fritadeira e otima, estou muito satisfeita com a compra. Chegou rapido e muito bem embalada.',
    avatar: '/assets/img/foto2.webp',
    images: ['/assets/img/review02.webp'],
  },
  {
    name: 'Marilia L.',
    date: '2026-03-19',
    rating: 5,
    variant: '12 Litros - Preto',
    comment: 'Linda e eficiente.',
    avatar: '/assets/img/foto3.webp',
    images: ['/assets/img/review03.webp'],
  },
  {
    name: 'Karina A.',
    date: '2026-03-18',
    rating: 5,
    variant: '12 Litros - Preto',
    comment: 'Otimo produto conforme anunciado. Chegou antes do previsto. Super recomendo.',
    avatar: '/assets/img/foto4.webp',
    images: ['/assets/img/review04.webp'],
  },
  {
    name: 'Bruna S.',
    date: '2026-03-17',
    rating: 5,
    variant: '12 Litros - Preto',
    comment: 'Bonita, grande e eficiente. Nada a reclamar ate o momento.',
    avatar: '/assets/img/foto5.webp',
    images: ['/assets/img/review05.webp'],
  },
  {
    name: 'Kailane C.',
    date: '2026-03-16',
    rating: 5,
    variant: '12 Litros - Preto',
    comment: 'Superou minhas expectativas. Linda e muito pratica.',
    avatar: '/assets/img/foto6.webp',
    images: ['/assets/img/review06.webp'],
  },
  {
    name: 'Mariana L.',
    date: '2026-03-15',
    rating: 5,
    variant: '12 Litros - Preto',
    comment: 'Simplesmente apaixonada. Excelente mesmo.',
    avatar: '/assets/img/foto7.webp',
    images: ['/assets/img/review07.webp'],
  },
];

const DEFAULT_EXTRA_REVIEWS = [
  {
    name: 'Camila S.',
    date: '2026-03-14',
    rating: 5,
    variant: '12 Litros - Preto',
    comment: 'Chegou bem embalada e o tamanho surpreende. Excelente para familia.',
    avatar_color: '#e53935',
    images: ['/assets/img/avaliacao_01.webp', '/assets/img/avaliacao_02.webp'],
  },
  {
    name: 'Juliana R.',
    date: '2026-03-12',
    rating: 5,
    variant: '12 Litros - Preto',
    comment: 'Muito pratica, potente e facil de limpar. Uso quase todos os dias.',
    avatar_color: '#8e24aa',
    images: ['/assets/img/avaliacao_05.webp'],
  },
  {
    name: 'Patricia M.',
    date: '2026-03-11',
    rating: 5,
    variant: '12 Litros - Preto',
    comment: 'Design bonito, painel intuitivo e resultado excelente em varias receitas.',
    avatar_color: '#1e88e5',
    images: ['/assets/img/avaliacao_14.webp'],
  },
  {
    name: 'Renata O.',
    date: '2026-03-09',
    rating: 4,
    variant: '12 Litros - Preto',
    comment: 'Vale muito a pena pelo preco. Bem espacosa e silenciosa.',
    avatar_color: '#43a047',
    images: ['/assets/img/avaliacao_17.webp'],
  },
  {
    name: 'Aline T.',
    date: '2026-03-08',
    rating: 5,
    variant: '12 Litros - Preto',
    comment: 'Amei. Facilita demais a rotina e ainda fica linda na cozinha.',
    avatar_color: '#fb8c00',
    images: [],
  },
  {
    name: 'Vanessa B.',
    date: '2026-03-07',
    rating: 5,
    variant: '12 Litros - Preto',
    comment: 'Comprei depois de pesquisar bastante e nao me arrependi.',
    avatar_color: '#00897b',
    images: ['/assets/img/avaliacao_21.webp'],
  },
  {
    name: 'Tatiane F.',
    date: '2026-03-05',
    rating: 5,
    variant: '12 Litros - Preto',
    comment: 'As receitas ficam crocantes e o forno substituiu meu equipamento antigo.',
    avatar_color: '#5e35b1',
    images: [],
  },
  {
    name: 'Cristina G.',
    date: '2026-03-03',
    rating: 5,
    variant: '12 Litros - Preto',
    comment: 'Muito bom. Excelente custo-beneficio e envio rapido.',
    avatar_color: '#d81b60',
    images: ['/assets/img/avaliacao_25.webp'],
  },
];

const DEFAULT_DESCRIPTION_BULLETS = [
  {
    icon: '9878',
    title: '2 em 1 - Air Fryer + Forno',
    text: 'Tecnologia de circulacao de ar com o espaco e a versatilidade de um forno convencional.',
  },
  {
    icon: '9733',
    title: '12 litros de capacidade',
    text: 'Prepare refeicoes completas de uma so vez para toda a familia.',
  },
  {
    icon: '9737',
    title: 'Visor com iluminacao interna',
    text: 'Acompanhe o preparo sem precisar abrir a porta.',
  },
  {
    icon: '9881',
    title: 'Cesto 5L + 3 assadeiras antiaderentes',
    text: 'Ideal para pao de queijo, nuggets, pizza, batata frita e bolos.',
  },
  {
    icon: '9776',
    title: 'Painel digital com 10 funcoes',
    text: 'Batata, frango, carne, peixe, camarao, pao de queijo, pizza, bolo, legumes e reaquecer.',
  },
  {
    icon: '10003',
    title: 'Antiaderente Duraflon',
    text: 'Nada gruda. Limpeza rapida e sem esforco.',
  },
  {
    icon: '9201',
    title: 'Timer de 90 minutos',
    text: 'Sem oleo, sem fumaca e com desligamento automatico.',
  },
];

function nowIso() {
  return new Date().toISOString();
}

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalizeCurrency(value, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return Number(value);
  if (typeof value === 'string') {
    const normalized = Number(String(value).replace(',', '.'));
    if (Number.isFinite(normalized)) return normalized;
  }
  return fallback;
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function absolutizeAssetPath(value) {
  if (!hasText(value)) return '';
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return trimmed.startsWith('/') ? trimmed : `/${trimmed.replace(/^\/+/, '')}`;
}

function normalizeImage(item, fallbackAlt = '') {
  if (typeof item === 'string') {
    const src = absolutizeAssetPath(item);
    return src ? { src, thumbnail: src, alt: fallbackAlt || 'Imagem do produto' } : null;
  }

  if (!item || typeof item !== 'object') return null;

  const src = absolutizeAssetPath(item.src || item.image || '');
  if (!src) return null;

  const thumbnail = absolutizeAssetPath(item.thumbnail || item.thumb || src) || src;
  return {
    src,
    thumbnail,
    alt: hasText(item.alt) ? item.alt.trim() : (fallbackAlt || 'Imagem do produto'),
  };
}

function normalizeReview(review, index = 0) {
  if (!review || typeof review !== 'object') return null;

  const images = ensureArray(review.images).map((image) => absolutizeAssetPath(image)).filter(Boolean);
  const avatar = hasText(review.avatar) ? absolutizeAssetPath(review.avatar) : '';
  const rating = Math.min(5, Math.max(1, Math.round(normalizeCurrency(review.rating, 5))));
  const name = hasText(review.name) ? review.name.trim() : `Cliente ${index + 1}`;
  const variant = hasText(review.variant) ? review.variant.trim() : 'Variacao padrao';
  const comment = hasText(review.comment) ? review.comment.trim() : '';
  if (!comment) return null;

  return {
    name,
    date: hasText(review.date) ? review.date.trim() : nowIso().slice(0, 10),
    rating,
    variant,
    comment,
    avatar,
    avatar_color: hasText(review.avatar_color) ? review.avatar_color.trim() : '',
    images,
  };
}

function normalizeBullet(bullet, index = 0) {
  if (!bullet || typeof bullet !== 'object') return null;

  const title = hasText(bullet.title) ? bullet.title.trim() : `Destaque ${index + 1}`;
  const text = hasText(bullet.text) ? bullet.text.trim() : '';
  if (!text) return null;

  return {
    icon: hasText(bullet.icon) ? bullet.icon.trim() : '9733',
    title,
    text,
  };
}

function computeDiscountBadge(original, landing) {
  if (!original || !landing || original <= landing) return 'Oferta especial';
  const pct = Math.round(((original - landing) / original) * 100);
  return `Desconto de ${pct}%`;
}

function computeDiscountText(original, landing) {
  if (!original || !landing || original <= landing) return 'Condicao exclusiva por tempo limitado';
  return `Economize R$ ${Number(original - landing).toFixed(2).replace('.', ',')}`;
}

function buildDefaultProduct(legacyPix = null) {
  const pixCode = legacyPix && hasText(legacyPix.pix_code)
    ? legacyPix.pix_code.trim()
    : '00020101021226900014br.gov.bcb.pix2568pix.adyen.com/pixqrcodelocation/pixloc/v1/loc/hWu3o18RS3OOujzeqNF5iQ5204000053039865802BR5925MONETIZZE IMPULSIONADORA 6009SAO PAULO62070503***63047984';
  const qrCodeUrl = legacyPix && (legacyPix.qrcode_url === null || hasText(legacyPix.qrcode_url))
    ? legacyPix.qrcode_url === null ? null : absolutizeAssetPath(legacyPix.qrcode_url)
    : '/assets/img/qrcode.webp';

  return {
    slug: 'fritadeira-eletrica-forno-oven-12l',
    active: true,
    is_default: true,
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
      { src: '/assets/img/04.webp', thumbnail: '/assets/img/thumb_04.webp', alt: 'Detalhe da capacidade do produto' },
      { src: '/assets/img/05.webp', thumbnail: '/assets/img/thumb_05.webp', alt: 'Detalhe frontal do produto' },
      { src: '/assets/img/06.webp', thumbnail: '/assets/img/thumb_06.webp', alt: 'Detalhe do painel do produto' },
      { src: '/assets/img/07.webp', thumbnail: '/assets/img/thumb_07.webp', alt: 'Foto aberta do produto' },
      { src: '/assets/img/08.webp', thumbnail: '/assets/img/thumb_08.webp', alt: 'Foto em uso do produto' },
    ],
    visible_reviews: DEFAULT_VISIBLE_REVIEWS,
    extra_reviews: DEFAULT_EXTRA_REVIEWS,
    description: {
      heading: 'Sobre o produto',
      text:
        'Air Fryer + Forno em um unico aparelho. Asse, cozinhe e frite sem oleo com a praticidade e o espaco que a sua cozinha precisa.',
      bullets: DEFAULT_DESCRIPTION_BULLETS,
      info_title: 'Informacoes',
      info_text:
        'Pagamento processado com seguranca. 1 ano de garantia do fabricante e envio para todo o Brasil.',
    },
    checkout: {
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
      pix_code: pixCode,
      qrcode_url: qrCodeUrl,
    },
    tracking: {
      pixel_id: 'D6VVDPJC77UANC7P0IT0',
      capi_access_token: '',
      capi_test_code: '',
      capi_label: 'fritadeira-12l',
      content_id: 'AFON-12L-BI',
      content_name: 'Fritadeira Eletrica Forno Oven 12L Mondial AFON-12L-BI',
      content_type: 'product',
      content_category: 'Eletroportateis',
      currency: 'BRL',
      quantity: 1,
    },
    created_at: nowIso(),
    updated_at: nowIso(),
  };
}

function normalizeProduct(raw, fallbackProduct = null, options = {}) {
  const fallback = fallbackProduct || buildDefaultProduct(options.legacyPix || null);

  const title = hasText(raw && raw.title) ? raw.title.trim() : fallback.title;
  const slug = hasText(raw && raw.slug) ? raw.slug.trim().toLowerCase() : fallback.slug;
  const pricesOriginal = raw && raw.prices && typeof raw.prices === 'object' ? raw.prices : {};
  const trackingRaw = raw && raw.tracking && typeof raw.tracking === 'object' ? raw.tracking : {};
  const statsRaw = raw && raw.stats && typeof raw.stats === 'object' ? raw.stats : {};
  const pixRaw = raw && raw.pix && typeof raw.pix === 'object' ? raw.pix : {};
  const checkoutRaw = raw && raw.checkout && typeof raw.checkout === 'object' ? raw.checkout : {};
  const descriptionRaw = raw && raw.description && typeof raw.description === 'object' ? raw.description : {};

  const originalPrice = normalizeCurrency(pricesOriginal.original, fallback.prices.original);
  const landingPrice = normalizeCurrency(pricesOriginal.landing, fallback.prices.landing);
  const checkoutPrice = normalizeCurrency(pricesOriginal.checkout, fallback.prices.checkout || landingPrice);

  const images = ensureArray(raw && raw.images)
    .map((item) => normalizeImage(item, title))
    .filter(Boolean);
  const normalizedImages = images.length ? images : fallback.images.map((item) => ({ ...item }));

  const visibleReviews = ensureArray(raw && raw.visible_reviews)
    .map((review, index) => normalizeReview(review, index))
    .filter(Boolean);
  const extraReviews = ensureArray(raw && raw.extra_reviews)
    .map((review, index) => normalizeReview(review, index))
    .filter(Boolean);

  const bullets = ensureArray(descriptionRaw.bullets)
    .map((bullet, index) => normalizeBullet(bullet, index))
    .filter(Boolean);

  const ratingBreakdown = ensureArray(statsRaw.rating_breakdown)
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const stars = Math.min(5, Math.max(1, Math.round(normalizeCurrency(item.stars, 0))));
      const count = Math.max(0, Math.round(normalizeCurrency(item.count, 0)));
      if (!stars) return null;
      return { stars, count };
    })
    .filter(Boolean)
    .sort((a, b) => b.stars - a.stars);

  const normalized = {
    slug,
    active: raw && raw.active !== undefined ? Boolean(raw.active) : fallback.active,
    is_default: raw && raw.is_default !== undefined ? Boolean(raw.is_default) : fallback.is_default,
    title,
    short_description: hasText(raw && raw.short_description) ? raw.short_description.trim() : fallback.short_description,
    seo_description: hasText(raw && raw.seo_description) ? raw.seo_description.trim() : fallback.seo_description,
    category: hasText(raw && raw.category) ? raw.category.trim() : fallback.category,
    variant_label: hasText(raw && raw.variant_label) ? raw.variant_label.trim() : fallback.variant_label,
    prices: {
      original: originalPrice,
      landing: landingPrice,
      checkout: checkoutPrice,
      discount_badge: hasText(pricesOriginal.discount_badge)
        ? pricesOriginal.discount_badge.trim()
        : computeDiscountBadge(originalPrice, landingPrice),
      discount_text: hasText(pricesOriginal.discount_text)
        ? pricesOriginal.discount_text.trim()
        : computeDiscountText(originalPrice, landingPrice),
    },
    stats: {
      rating_value: normalizeCurrency(statsRaw.rating_value, fallback.stats.rating_value),
      rating_count: Math.max(0, Math.round(normalizeCurrency(statsRaw.rating_count, fallback.stats.rating_count))),
      sold_count: Math.max(0, Math.round(normalizeCurrency(statsRaw.sold_count, fallback.stats.sold_count))),
      review_count: Math.max(0, Math.round(normalizeCurrency(statsRaw.review_count, fallback.stats.review_count))),
      rating_breakdown: ratingBreakdown.length ? ratingBreakdown : fallback.stats.rating_breakdown.map((item) => ({ ...item })),
    },
    images: normalizedImages,
    visible_reviews: visibleReviews.length ? visibleReviews : fallback.visible_reviews.map((item) => ({ ...item })),
    extra_reviews: extraReviews.length ? extraReviews : fallback.extra_reviews.map((item) => ({ ...item })),
    description: {
      heading: hasText(descriptionRaw.heading) ? descriptionRaw.heading.trim() : fallback.description.heading,
      text: hasText(descriptionRaw.text) ? descriptionRaw.text.trim() : fallback.description.text,
      bullets: bullets.length ? bullets : fallback.description.bullets.map((item) => ({ ...item })),
      info_title: hasText(descriptionRaw.info_title) ? descriptionRaw.info_title.trim() : fallback.description.info_title,
      info_text: hasText(descriptionRaw.info_text) ? descriptionRaw.info_text.trim() : fallback.description.info_text,
    },
    checkout: {
      offer_badge: hasText(checkoutRaw.offer_badge) ? checkoutRaw.offer_badge.trim() : fallback.checkout.offer_badge,
      guarantee_title: hasText(checkoutRaw.guarantee_title)
        ? checkoutRaw.guarantee_title.trim()
        : fallback.checkout.guarantee_title,
      guarantee_text: hasText(checkoutRaw.guarantee_text)
        ? checkoutRaw.guarantee_text.trim()
        : fallback.checkout.guarantee_text,
      submit_label: hasText(checkoutRaw.submit_label) ? checkoutRaw.submit_label.trim() : fallback.checkout.submit_label,
      success_title_template: hasText(checkoutRaw.success_title_template)
        ? checkoutRaw.success_title_template.trim()
        : fallback.checkout.success_title_template,
      success_subtitle: hasText(checkoutRaw.success_subtitle)
        ? checkoutRaw.success_subtitle.trim()
        : fallback.checkout.success_subtitle,
      payment_label: hasText(checkoutRaw.payment_label)
        ? checkoutRaw.payment_label.trim()
        : fallback.checkout.payment_label,
      payment_badge: hasText(checkoutRaw.payment_badge)
        ? checkoutRaw.payment_badge.trim()
        : fallback.checkout.payment_badge,
      payment_instructions: ensureArray(checkoutRaw.payment_instructions).length
        ? ensureArray(checkoutRaw.payment_instructions)
            .map((step) => {
              if (!step || typeof step !== 'object') return null;
              const titleText = hasText(step.title) ? step.title.trim() : '';
              const descText = hasText(step.desc) ? step.desc.trim() : '';
              if (!titleText || !descText) return null;
              return { title: titleText, desc: descText };
            })
            .filter(Boolean)
        : fallback.checkout.payment_instructions.map((item) => ({ ...item })),
      footer_primary: hasText(checkoutRaw.footer_primary)
        ? checkoutRaw.footer_primary.trim()
        : fallback.checkout.footer_primary,
      footer_secondary: hasText(checkoutRaw.footer_secondary)
        ? checkoutRaw.footer_secondary.trim()
        : fallback.checkout.footer_secondary,
    },
    pix: {
      pix_code: hasText(pixRaw.pix_code) ? pixRaw.pix_code.trim() : fallback.pix.pix_code,
      qrcode_url: pixRaw.qrcode_url === null
        ? null
        : hasText(pixRaw.qrcode_url)
          ? absolutizeAssetPath(pixRaw.qrcode_url)
          : fallback.pix.qrcode_url,
    },
    tracking: {
      pixel_id: hasText(trackingRaw.pixel_id) ? trackingRaw.pixel_id.trim() : fallback.tracking.pixel_id,
      capi_access_token: hasText(trackingRaw.capi_access_token)
        ? trackingRaw.capi_access_token.trim()
        : (fallback.tracking.capi_access_token || ''),
      capi_test_code: hasText(trackingRaw.capi_test_code)
        ? trackingRaw.capi_test_code.trim()
        : (fallback.tracking.capi_test_code || ''),
      capi_label: hasText(trackingRaw.capi_label) ? trackingRaw.capi_label.trim() : fallback.tracking.capi_label,
      content_id: hasText(trackingRaw.content_id) ? trackingRaw.content_id.trim() : fallback.tracking.content_id,
      content_name: hasText(trackingRaw.content_name) ? trackingRaw.content_name.trim() : title,
      content_type: hasText(trackingRaw.content_type)
        ? trackingRaw.content_type.trim()
        : fallback.tracking.content_type,
      content_category: hasText(trackingRaw.content_category)
        ? trackingRaw.content_category.trim()
        : (hasText(raw && raw.category) ? raw.category.trim() : fallback.tracking.content_category),
      currency: hasText(trackingRaw.currency) ? trackingRaw.currency.trim().toUpperCase() : fallback.tracking.currency,
      quantity: Math.max(1, Math.round(normalizeCurrency(trackingRaw.quantity, fallback.tracking.quantity || 1))),
    },
    created_at: hasText(raw && raw.created_at) ? raw.created_at.trim() : fallback.created_at || nowIso(),
    updated_at: hasText(raw && raw.updated_at) ? raw.updated_at.trim() : nowIso(),
  };

  return normalized;
}

export async function getDefaultStore(env) {
  let legacyPix = null;
  try {
    legacyPix = await env.PIX_STORE.get(LEGACY_PIX_KEY, { type: 'json' });
  } catch {
    legacyPix = null;
  }

  const defaultProduct = normalizeProduct(buildDefaultProduct(legacyPix), null, { legacyPix });

  return {
    schema_version: 2,
    default_product_slug: defaultProduct.slug,
    products: [defaultProduct],
    updated_at: nowIso(),
  };
}

export function normalizeStore(store, options = {}) {
  const products = ensureArray(store && store.products);
  const fallback = buildDefaultProduct(options.legacyPix || null);

  const normalizedProducts = products.length
    ? products
        .map((product) => normalizeProduct(product, fallback, options))
        .filter((product, index, array) => product.slug && array.findIndex((item) => item.slug === product.slug) === index)
    : [normalizeProduct(fallback, fallback, options)];

  let defaultProductSlug = hasText(store && store.default_product_slug)
    ? store.default_product_slug.trim().toLowerCase()
    : '';
  if (!normalizedProducts.some((product) => product.slug === defaultProductSlug)) {
    const flaggedDefault = normalizedProducts.find((product) => product.is_default) || normalizedProducts[0];
    defaultProductSlug = flaggedDefault.slug;
  }

  const finalProducts = normalizedProducts.map((product) => ({
    ...product,
    is_default: product.slug === defaultProductSlug,
  }));

  return {
    schema_version: 2,
    default_product_slug: defaultProductSlug,
    products: finalProducts,
    updated_at: hasText(store && store.updated_at) ? store.updated_at.trim() : nowIso(),
  };
}

export async function getStore(env) {
  let raw = null;
  try {
    raw = await env.PIX_STORE.get(STORE_KEY, { type: 'json' });
  } catch {
    raw = null;
  }

  if (!raw || typeof raw !== 'object') {
    return getDefaultStore(env);
  }

  return normalizeStore(raw);
}

export async function saveStore(env, store) {
  const normalized = normalizeStore(store);
  normalized.updated_at = nowIso();
  await env.PIX_STORE.put(STORE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function getProductBySlug(store, slug = '') {
  const normalizedSlug = hasText(slug) ? slug.trim().toLowerCase() : '';
  if (normalizedSlug) {
    const found = ensureArray(store && store.products).find((product) => product.slug === normalizedSlug);
    if (found) return found;
  }

  const fallbackSlug = store && store.default_product_slug;
  return ensureArray(store && store.products).find((product) => product.slug === fallbackSlug) || ensureArray(store && store.products)[0] || null;
}

export function buildProductLinks(product) {
  const slug = product && product.slug ? product.slug : '';
  return {
    landing_path: slug ? `/p/${encodeURIComponent(slug)}` : '/',
    checkout_path: slug ? `/c/${encodeURIComponent(slug)}` : '/c/',
    query_landing_path: slug ? `/?product=${encodeURIComponent(slug)}` : '/',
    query_checkout_path: slug ? `/c/?product=${encodeURIComponent(slug)}` : '/c/',
  };
}

export function buildTrackingContent(product) {
  const qty = product && product.tracking ? product.tracking.quantity || 1 : 1;
  const price = product && product.prices ? normalizeCurrency(product.prices.checkout || product.prices.landing, 0) : 0;
  const contentId = product && product.tracking && hasText(product.tracking.content_id)
    ? product.tracking.content_id.trim()
    : (product && product.slug ? product.slug : 'default-product');
  const contentName = product && product.tracking && hasText(product.tracking.content_name)
    ? product.tracking.content_name.trim()
    : (product && product.title ? product.title : 'Produto');

  return {
    content_type: product && product.tracking && hasText(product.tracking.content_type)
      ? product.tracking.content_type.trim()
      : 'product',
    contents: [{
      content_id: contentId,
      id: contentId,
      quantity: qty,
      price,
      item_price: price,
    }],
    content_id: contentId,
    content_ids: [contentId],
    content_name: contentName,
    content_category: product && product.tracking && hasText(product.tracking.content_category)
      ? product.tracking.content_category.trim()
      : (product && product.category ? product.category : ''),
    description: product && product.short_description ? product.short_description : '',
    quantity: qty,
    price,
    value: price,
    currency: product && product.tracking && hasText(product.tracking.currency)
      ? product.tracking.currency.trim().toUpperCase()
      : 'BRL',
  };
}

export function sanitizePublicProduct(product) {
  const links = buildProductLinks(product);
  return {
    slug: product.slug,
    active: product.active,
    is_default: product.is_default,
    title: product.title,
    short_description: product.short_description,
    seo_description: product.seo_description,
    category: product.category,
    variant_label: product.variant_label,
    prices: { ...product.prices },
    stats: {
      ...product.stats,
      rating_breakdown: ensureArray(product.stats && product.stats.rating_breakdown).map((item) => ({ ...item })),
    },
    images: ensureArray(product.images).map((item) => ({ ...item })),
    visible_reviews: ensureArray(product.visible_reviews).map((item) => ({ ...item })),
    extra_reviews: ensureArray(product.extra_reviews).map((item) => ({ ...item })),
    description: {
      ...product.description,
      bullets: ensureArray(product.description && product.description.bullets).map((item) => ({ ...item })),
    },
    checkout: {
      ...product.checkout,
      payment_instructions: ensureArray(product.checkout && product.checkout.payment_instructions).map((item) => ({ ...item })),
    },
    pix: {
      pix_code: product.pix && product.pix.pix_code ? product.pix.pix_code : '',
      qrcode_url: product.pix ? product.pix.qrcode_url : '',
    },
    tracking: {
      pixel_id: product.tracking ? product.tracking.pixel_id : '',
      capi_label: product.tracking ? product.tracking.capi_label : '',
      content_id: product.tracking ? product.tracking.content_id : '',
      content_name: product.tracking ? product.tracking.content_name : '',
      content_type: product.tracking ? product.tracking.content_type : '',
      content_category: product.tracking ? product.tracking.content_category : '',
      currency: product.tracking ? product.tracking.currency : 'BRL',
      quantity: product.tracking ? product.tracking.quantity : 1,
    },
    tracking_content: buildTrackingContent(product),
    links,
    updated_at: product.updated_at,
  };
}

export function sanitizeAdminStore(store) {
  const products = ensureArray(store && store.products).map((product) => ({
    ...product,
    images: ensureArray(product.images).map((item) => ({ ...item })),
    visible_reviews: ensureArray(product.visible_reviews).map((item) => ({ ...item })),
    extra_reviews: ensureArray(product.extra_reviews).map((item) => ({ ...item })),
    description: {
      ...product.description,
      bullets: ensureArray(product.description && product.description.bullets).map((item) => ({ ...item })),
    },
    checkout: {
      ...product.checkout,
      payment_instructions: ensureArray(product.checkout && product.checkout.payment_instructions).map((item) => ({ ...item })),
    },
    tracking_content: buildTrackingContent(product),
    links: buildProductLinks(product),
  }));

  return {
    schema_version: 2,
    default_product_slug: store.default_product_slug,
    updated_at: store.updated_at,
    products,
  };
}
