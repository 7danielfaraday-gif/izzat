(function () {
  function formatCurrency(value) {
    if (typeof window.formatCurrencyBRL === 'function') return window.formatCurrencyBRL(value);
    const amount = typeof value === 'number' ? value : Number(value || 0);
    return 'R$ ' + amount.toFixed(2).replace('.', ',');
  }

  function renderHost(product) {
    if (!product) return;
    const image = Array.isArray(product.images) && product.images[0] ? product.images[0].src : '/assets/img/01.webp';
    document.title = 'Checkout - ' + (product.title || 'Produto');
    document.querySelectorAll('.static-title').forEach(function (element) {
      element.textContent = product.title || '';
    });
    document.querySelectorAll('.static-old-price').forEach(function (element) {
      element.textContent = 'De ' + formatCurrency(product.prices && product.prices.original);
    });
    document.querySelectorAll('.static-new-price').forEach(function (element) {
      element.textContent = 'Por ' + formatCurrency(product.prices && (product.prices.checkout || product.prices.landing));
    });
    document.querySelectorAll('.static-img').forEach(function (element) {
      element.src = image;
      element.alt = product.title || 'Produto';
    });
  }

  if (window.__PRODUCT_CONFIG) renderHost(window.__PRODUCT_CONFIG);
  if (typeof window.onProductConfigReady === 'function') window.onProductConfigReady(renderHost);
})();
