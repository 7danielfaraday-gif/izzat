(function () {
  function formatCurrency(value) {
    if (typeof window.formatCurrencyBRL === 'function') return window.formatCurrencyBRL(value);
    const amount = typeof value === 'number' ? value : Number(value || 0);
    return 'R$ ' + amount.toFixed(2).replace('.', ',');
  }

  function formatInteger(value) {
    try {
      return Number(value || 0).toLocaleString('pt-BR');
    } catch (error) {
      return String(value || 0);
    }
  }

  function escapeHtml(value) {
    if (typeof window.escapeHtml === 'function') return window.escapeHtml(value);
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function buildReviewStars(rating) {
    const total = Math.max(1, Math.min(5, Number(rating || 5)));
    let stars = '';
    for (let index = 0; index < total; index += 1) stars += '★';
    return stars;
  }

  function formatReviewDate(value) {
    if (!value) return '';
    try {
      return new Date(value).toLocaleDateString('pt-BR');
    } catch (error) {
      return value;
    }
  }

  function renderDescription(product) {
    const container = document.getElementById('description');
    if (!container || !product || !product.description) return;

    const bullets = Array.isArray(product.description.bullets) ? product.description.bullets : [];
    const bulletsHtml = bullets.map(function (bullet) {
      return ''
        + '<div style="display:flex;gap:12px;align-items:flex-start;">'
        + '<div style="min-width:36px;height:36px;border-radius:10px;background:#f0fdf4;display:flex;align-items:center;justify-content:center;font-size:18px;">&#' + escapeHtml(bullet.icon || '9733') + ';</div>'
        + '<div>'
        + '<div style="font-size:13px;font-weight:600;color:#222;">' + escapeHtml(bullet.title || '') + '</div>'
        + '<div style="font-size:12px;color:#888;line-height:1.5;margin-top:2px;">' + escapeHtml(bullet.text || '') + '</div>'
        + '</div>'
        + '</div>';
    }).join('');

    container.innerHTML = ''
      + '<section style="padding:16px;background:#fff;">'
      + '<h3 style="font-size:15px;font-weight:700;color:#222;margin:0 0 12px;">' + escapeHtml(product.description.heading || 'Sobre o produto') + '</h3>'
      + '<p style="font-size:13px;color:#555;line-height:1.6;margin:0 0 16px;">' + escapeHtml(product.description.text || '') + '</p>'
      + '<div style="display:flex;flex-direction:column;gap:14px;">' + bulletsHtml + '</div>'
      + '<div style="margin-top:18px;padding:14px;background:#f9fafb;border-radius:10px;border:1px solid #f0f0f0;">'
      + '<div style="font-size:12px;font-weight:600;color:#999;margin-bottom:6px;">' + escapeHtml(product.description.info_title || 'Informacoes') + '</div>'
      + '<div style="font-size:11px;color:#aaa;line-height:1.6;">' + escapeHtml(product.description.info_text || '') + '</div>'
      + '</div>'
      + '</section>';
  }

  function renderReviewCard(review, useAvatarColor) {
    const imageHtml = Array.isArray(review.images) && review.images.length
      ? '<div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap;">'
          + review.images.map(function (image) {
              return '<img src="' + escapeHtml(image) + '" alt="" style="width:70px;height:70px;object-fit:cover;border-radius:8px;cursor:pointer;" onclick="openLightbox(this.src)"/>';
            }).join('')
          + '</div>'
      : '';

    const avatarHtml = review.avatar
      ? '<img src="' + escapeHtml(review.avatar) + '" alt="" style="width:32px;height:32px;border-radius:50%;object-fit:cover;" />'
      : '<div style="width:32px;height:32px;border-radius:50%;background:' + escapeHtml(review.avatar_color || '#16a34a') + ';display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;font-weight:700;flex-shrink:0;">' + escapeHtml(String(review.name || 'C').charAt(0).toUpperCase()) + '</div>';

    return ''
      + '<div class="rv" style="padding:14px 0;border-bottom:1px solid #f0f0f0;">'
      + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">'
      + avatarHtml
      + '<span style="font-size:14px;font-weight:700;color:#222;">' + escapeHtml(review.name || 'Cliente') + '</span>'
      + '</div>'
      + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">'
      + '<span style="color:#f59e0b;font-size:11px;letter-spacing:-1px;">' + buildReviewStars(review.rating) + '</span>'
      + '<span style="font-size:11px;color:#aaa;">' + escapeHtml(formatReviewDate(review.date)) + '</span>'
      + '</div>'
      + '<div style="font-size:11px;color:#aaa;margin-bottom:8px;">Variacao: ' + escapeHtml(review.variant || (useAvatarColor ? 'Padrao' : '')) + '</div>'
      + '<div style="font-size:13px;color:#333;line-height:1.5;">' + escapeHtml(review.comment || '') + '</div>'
      + imageHtml
      + '</div>';
  }

  function renderReviews(product) {
    const section = document.querySelector('.reviews-section');
    if (!section || !product) return;

    const stats = product.stats || {};
    const visibleReviews = Array.isArray(product.visible_reviews) ? product.visible_reviews : [];
    const extraReviews = Array.isArray(product.extra_reviews) ? product.extra_reviews : [];
    const breakdown = Array.isArray(stats.rating_breakdown) ? stats.rating_breakdown.slice().sort(function (a, b) { return Number(b.stars || 0) - Number(a.stars || 0); }) : [];
    const maxCount = breakdown.reduce(function (max, item) {
      return Math.max(max, Number(item.count || 0));
    }, 1);

    const summaryBars = breakdown.map(function (item) {
      const width = maxCount > 0 ? Math.max(0, Math.min(100, (Number(item.count || 0) / maxCount) * 100)) : 0;
      return ''
        + '<div style="display:flex;align-items:center;gap:4px;font-size:11px;"><span style="color:#999;width:14px;">' + escapeHtml(String(item.stars || 0)) + '★</span>'
        + '<div style="flex:1;height:6px;background:#f0f0f0;border-radius:3px;overflow:hidden;"><div style="width:' + width.toFixed(0) + '%;height:100%;background:#f59e0b;border-radius:3px;"></div></div>'
        + '<span style="color:#999;width:18px;text-align:right;">' + escapeHtml(String(item.count || 0)) + '</span></div>';
    }).join('');

    section.innerHTML = ''
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">'
      + '<span style="font-size:15px;font-weight:700;color:#222;">Avaliacoes (' + escapeHtml(String(stats.review_count || visibleReviews.length || 0)) + ')</span>'
      + '<span style="color:#00d4aa;font-size:13px;font-weight:600;cursor:pointer;">Avaliar</span>'
      + '</div>'
      + '<div style="display:flex;align-items:flex-start;gap:16px;margin-bottom:14px;">'
      + '<div style="text-align:center;min-width:65px;">'
      + '<div style="font-size:32px;font-weight:800;color:#222;line-height:1;">' + escapeHtml(String(stats.rating_value || 0)) + '</div>'
      + '<div style="color:#f59e0b;font-size:11px;margin-top:3px;letter-spacing:-1px;">★★★★★</div>'
      + '<div style="font-size:10px;color:#999;margin-top:2px;">' + escapeHtml(String(stats.review_count || visibleReviews.length || 0)) + ' avaliacoes</div>'
      + '</div>'
      + '<div style="flex:1;display:flex;flex-direction:column;gap:3px;padding-top:2px;">' + summaryBars + '</div>'
      + '</div>'
      + visibleReviews.map(function (review) { return renderReviewCard(review, false); }).join('')
      + '<div id="extra-reviews"></div>'
      + '<div id="load-more-reviews" style="text-align:center;padding:16px 0;border-top:1px solid #f0f0f0;cursor:pointer;">'
      + '<span style="font-size:13px;color:#555;">&#8744;&nbsp;&nbsp;Carregar mais comentarios (<span id="load-batch-count">0</span> de <span id="load-remaining-count">0</span> restantes)</span>'
      + '</div>';

    const extraContainer = document.getElementById('extra-reviews');
    const loadMore = document.getElementById('load-more-reviews');
    const batchCount = document.getElementById('load-batch-count');
    const remainingCount = document.getElementById('load-remaining-count');
    const batchSize = 5;
    let loaded = 0;

    function refreshLoadState() {
      if (!batchCount || !remainingCount || !loadMore) return;
      const remaining = Math.max(0, extraReviews.length - loaded);
      if (!remaining) {
        loadMore.style.display = 'none';
        return;
      }
      batchCount.textContent = String(Math.min(batchSize, remaining));
      remainingCount.textContent = String(remaining);
      loadMore.style.display = '';
    }

    window.loadMoreReviews = function () {
      const end = Math.min(extraReviews.length, loaded + batchSize);
      for (let index = loaded; index < end; index += 1) {
        extraContainer.insertAdjacentHTML('beforeend', renderReviewCard(extraReviews[index], true));
      }
      loaded = end;
      refreshLoadState();
    };

    if (loadMore) {
      loadMore.onclick = function () {
        window.loadMoreReviews();
      };
    }

    refreshLoadState();
  }

  function renderMeta(product) {
    if (!product) return;
    const title = 'Izzat - ' + (product.title || 'Produto');
    document.title = title;

    const metaDescription = document.querySelector('meta[name="description"]');
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDescription = document.querySelector('meta[property="og:description"]');
    const ogImage = document.querySelector('meta[property="og:image"]');
    const firstImage = Array.isArray(product.images) && product.images[0] ? product.images[0].src : '/assets/img/01.webp';

    if (metaDescription) metaDescription.setAttribute('content', product.seo_description || product.short_description || product.title || '');
    if (ogTitle) ogTitle.setAttribute('content', title);
    if (ogDescription) ogDescription.setAttribute('content', product.short_description || product.seo_description || '');
    if (ogImage) ogImage.setAttribute('content', firstImage);
  }

  function renderHero(product) {
    if (!product) return;
    const firstImage = Array.isArray(product.images) && product.images[0] ? product.images[0].src : '/assets/img/01.webp';
    const priceOriginal = formatCurrency(product.prices && product.prices.original);
    const priceLanding = formatCurrency(product.prices && product.prices.landing);

    const mappings = [
      ['hero-old-price', priceOriginal],
      ['hero-new-price', priceLanding],
      ['hero-discount-badge', product.prices && product.prices.discount_badge],
      ['hero-discount-text', product.prices && product.prices.discount_text],
      ['product-title', product.title],
      ['product-rating-value', String(product.stats && product.stats.rating_value || '0')],
      ['product-rating-count', '(' + String(product.stats && product.stats.rating_count || 0) + ')'],
      ['product-sold-count', formatInteger(product.stats && product.stats.sold_count || 0) + ' vendidos'],
      ['seller-sold-count', formatInteger(product.stats && product.stats.sold_count || 0)],
      ['seller-review-count', formatInteger(product.stats && product.stats.rating_count || 0)],
      ['seller-rating-value', String(product.stats && product.stats.rating_value || '0')],
      ['variant-title', product.variant_label || 'Variacao padrao'],
      ['variant-subtitle', 'Variacao ativa no momento'],
    ];

    mappings.forEach(function (entry) {
      const element = document.getElementById(entry[0]);
      if (element) element.textContent = entry[1] || '';
    });

    const mainImage = document.getElementById('main-product-image');
    if (mainImage) {
      mainImage.src = firstImage;
      mainImage.alt = product.title || 'Produto';
    }

    const variantImage = document.getElementById('variant-image');
    if (variantImage) {
      variantImage.src = firstImage;
      variantImage.alt = product.variant_label || product.title || 'Produto';
    }

    document.querySelectorAll('.static-title').forEach(function (element) {
      element.textContent = product.title || '';
    });
    document.querySelectorAll('.static-old-price').forEach(function (element) {
      element.textContent = 'De ' + priceOriginal;
    });
    document.querySelectorAll('.static-new-price').forEach(function (element) {
      element.textContent = 'Por ' + priceLanding;
    });
    document.querySelectorAll('.static-img').forEach(function (element) {
      element.src = firstImage;
      element.alt = product.title || 'Produto';
    });

    const buyNow = document.getElementById('buy-now');
    if (buyNow && window.__PRODUCT_CHECKOUT_PATH) {
      try {
        buyNow.dataset.checkoutTarget = window.buildCheckoutUrl
          ? window.buildCheckoutUrl(window.__PRODUCT_CHECKOUT_PATH)
          : window.__PRODUCT_CHECKOUT_PATH;
      } catch (error) {
        buyNow.dataset.checkoutTarget = window.__PRODUCT_CHECKOUT_PATH;
      }
    }

    window.__landingGalleryImages = Array.isArray(product.images) ? product.images.slice() : [];
    window.__salesPopupBuyers = (Array.isArray(product.visible_reviews) ? product.visible_reviews : []).map(function (review) {
      return {
        name: review.name || 'Cliente',
        city: product.variant_label || 'Brasil',
        img: review.avatar || firstImage,
      };
    });
  }

  function renderProduct(product) {
    renderMeta(product);
    renderHero(product);
    renderDescription(product);
    renderReviews(product);
  }

  if (window.__PRODUCT_CONFIG) renderProduct(window.__PRODUCT_CONFIG);
  if (typeof window.onProductConfigReady === 'function') {
    window.onProductConfigReady(renderProduct);
  }
})();
