// ==================================================
    // 1. TRACKING FACEBOOK PIXEL + CONVERSIONS API (CAPI)
    // ==================================================
    
    // Dados do Produto
    const PRODUCT_CONTENT = {
        contents: [{ content_id: 'AFON-12L-BI', id: 'AFON-12L-BI', quantity: 1, price: 197.99, item_price: 197.99 }],
        content_id: 'AFON-12L-BI',
        content_ids: ['AFON-12L-BI'],
        content_name: 'Fritadeira Elétrica Forno Oven 12L Mondial',
        description: 'Fritadeira Elétrica Forno Oven 12L Mondial AFON-12L-BI',
        content_type: 'product',
        category: 'Eletroportáteis',
        quantity: 1,
        price: 197.99,
        value: 197.99,
        currency: 'BRL'
    };

    // --- HELPER FUNCTIONS ---

    function setCookie(name, value, days) {
        var expires = "";
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days*24*60*60*1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "")  + expires + "; path=/; SameSite=Lax";
    }
    
    function getCookie(name) {
        var nameEQ = name + "=";
        var ca = document.cookie.split(';');
        for(var i=0;i < ca.length;i++) {
            var c = ca[i];
            while (c.charAt(0)==' ') c = c.substring(1,c.length);
            if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
        }
        return null;
    }

    function generateEventId() {
        return 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    function getEventSourceUrl() {
        try {
            var u = new URL(window.location.href);
            u.protocol = 'https:';
            u.host = 'lojaizzat.shop';
            return u.toString();
        } catch (_) {
            return 'https://lojaizzat.shop/';
        }
    }

    function getExternalId() {
        let eid = localStorage.getItem('user_external_id');
        if (!eid) eid = getCookie('user_external_id'); 
        
        if (!eid) {
            eid = 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
            localStorage.setItem('user_external_id', eid);
            setCookie('user_external_id', eid, 365); 
        }
        return eid;
    }

    function getFBCLID() {
        const urlParams = new URLSearchParams(window.location.search);
        let clickId = urlParams.get('fbclid');
        if (clickId) {
            setCookie('fbclid', clickId, 90);
            localStorage.setItem('fbclid', clickId);
        } else {
            clickId = localStorage.getItem('fbclid') || getCookie('fbclid');
        }
        return clickId;
    }

    function saveUTMs() {
        const urlParams = new URLSearchParams(window.location.search);
        const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
        utmKeys.forEach(key => {
            const val = urlParams.get(key);
            if (val) setCookie(key, val, 30);
        });
    }

    function getStoredUTMs() {
        const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
        let utms = {};
        utmKeys.forEach(key => {
            const val = getCookie(key);
            if (val) utms[key] = val;
        });
        return utms;
    }

    // Contexto Avançado (Fingerprinting Lite)
    function getContext() {
        let connection = 'unknown';
        if (navigator.connection) {
            connection = navigator.connection.effectiveType;
        }
        
        return {
            user_agent: navigator.userAgent,
            language: navigator.language,
            url: window.location.href,
            referrer: document.referrer,
            timestamp: Math.floor(Date.now() / 1000),
            screen_resolution: window.screen.width + 'x' + window.screen.height,
            connection_type: connection
        };
    }

    // Facebook Browser ID (_fbp cookie — set by Facebook Pixel SDK)
    function getFBP() {
        var match = document.cookie.match(/(?:^|;\s*)_fbp=([^;]*)/);
        return match ? match[1] : undefined;
    }

    // Facebook Click ID (_fbc cookie — format: fb.1.{timestamp}.{fbclid})
    function getFBC() {
        var match = document.cookie.match(/(?:^|;\s*)_fbc=([^;]*)/);
        if (match) return match[1];
        var fbclid = getFBCLID();
        if (fbclid) {
            return 'fb.1.' + Date.now() + '.' + fbclid;
        }
        return undefined;
    }

    function sendFacebookServerEvent(event, payload) {
        try {
            var eventId = (payload && payload.event_id) || generateEventId();
            var body = JSON.stringify({
                event: event,
                event_id: eventId,
                properties: payload || {},
                user: {
                    email: payload && payload.email ? payload.email : undefined,
                    phone_number: payload && payload.phone ? payload.phone : undefined,
                    external_id: payload && payload.external_id ? payload.external_id : getExternalId(),
                    fbc: getFBC(),
                    fbp: getFBP()
                }
            });

            if (navigator.sendBeacon) {
                navigator.sendBeacon('/api/facebook-events', new Blob([body], { type: 'application/json' }));
            } else {
                fetch('/api/facebook-events', {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: body,
                    keepalive: true
                }).catch(function(){});
            }
        } catch (_) {}
    }

    function trackPixelAndCAPI(event, data = {}) {
        try {
            const savedEmail = localStorage.getItem('user_hashed_email');
            const savedPhone = localStorage.getItem('user_hashed_phone');
            const eventId = data.event_id || generateEventId();

            let payload = {
                ...data,
                ...getContext(),
                event_id: eventId,
                external_id: getExternalId(),
                fbclid: getFBCLID(),
                ...getStoredUTMs()
            };

            payload.event_time = payload.timestamp || Math.floor(Date.now() / 1000);
            payload.event_source_url = getEventSourceUrl();

            if (savedEmail && !payload.email) payload.email = savedEmail;
            if (savedPhone && !payload.phone) payload.phone = savedPhone;

            if (window.fbq && typeof window.fbq === 'function') {
                try {
                    var browserPayload = { ...payload };
                    delete browserPayload.event_id;
                    window.fbq('track', event, browserPayload, { eventID: eventId });
                } catch (e) {}
            }

            sendFacebookServerEvent(event, payload);
        } catch (error) {
            console.error('Tracking Error:', error);
        }
    }

    // --- FUNÇÃO DE DISPARO HÍBRIDA (ZARAZ + MANUAL + BEACON) ---
    function trackViaZaraz(event, data = {}, useBeacon = false) {
        try {
            const savedEmail = localStorage.getItem('user_hashed_email');
            const savedPhone = localStorage.getItem('user_hashed_phone');
            const eventId = data.event_id || generateEventId();

            let payload = { 
                ...data, 
                event_id: eventId,
                ...getContext(),
                external_id: getExternalId(),
                fbclid: getFBCLID(),
                ...getStoredUTMs()
            };

            payload.event_time = payload.timestamp || Math.floor(Date.now() / 1000);
            payload.event_source_url = getEventSourceUrl();

            if (savedEmail && !payload.email) payload.email = savedEmail;
            if (savedPhone && !payload.phone) payload.phone = savedPhone;

            // 1. DISPARO MANUAL (Browser-Side via Facebook Pixel)
            if (window.fbq && typeof window.fbq === 'function') {
                if (event !== 'PageView') {
                    var browserPayload = { ...payload };
                    delete browserPayload.event_id;
                    window.fbq('track', event, browserPayload, { eventID: eventId });
                }
            }

            // 2. DISPARO ZARAZ (Server-Side)
            window.__zarazQueue = window.__zarazQueue || [];
            if (window.zaraz && window.zaraz.track) {
                window.zaraz.track(event, payload);
            } else {
                window.__zarazQueue.push({ event: event, payload: payload });
            }
            
        } catch (error) {
            console.error('Tracking Error:', error);
        }
    }



    // Garante envio server-side assim que o Zaraz estiver disponível
    (function zarazQueueFlusher(){
        var tries = 0;
        var timer = setInterval(function(){
            tries++;
            if (window.zaraz && window.zaraz.track && window.__zarazQueue && window.__zarazQueue.length) {
                var q = window.__zarazQueue.splice(0, window.__zarazQueue.length);
                for (var i = 0; i < q.length; i++) {
                    try { window.zaraz.track(q[i].event, q[i].payload); } catch(e) {}
                }
            }
            if (tries > 60 || ((window.zaraz && window.zaraz.track) && (!window.__zarazQueue || window.__zarazQueue.length === 0))) {
                clearInterval(timer);
            }
        }, 500);
    })();

    // --- TRIGGERS ---

    // 1. PageView
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);

    window.addEventListener('load', function() {
        saveUTMs();

        if (window.__izzatLandingSignalsFired) return;
        window.__izzatLandingSignalsFired = true;

        const landingPayload = {
            ...PRODUCT_CONTENT,
            content_name: PRODUCT_CONTENT.content_name,
            description: PRODUCT_CONTENT.description
        };

        trackPixelAndCAPI('PageView', {
            ...landingPayload,
            event_id: generateEventId()
        });

        trackPixelAndCAPI('ViewContent', {
            ...landingPayload,
            event_id: generateEventId()
        });
    });

    // 2. ViewContent Inteligente
    var viewContentFired = false;
    function fireViewContent() {
        if (viewContentFired) return;
        viewContentFired = true;

        trackViaZaraz('ViewContent', {
            ...PRODUCT_CONTENT,
            event_id: generateEventId()
        });
    }

    setTimeout(fireViewContent, 3500); 
    window.addEventListener('scroll', fireViewContent, { once: true, passive: true });
    window.addEventListener('touchmove', fireViewContent, { once: true, passive: true });

    // 3. CTA Comprar Agora (WebView-safe: não bloqueia navegação)
    window.buildCheckoutUrl = function(baseHref) {
        try {
            const urlObj = new URL(baseHref, window.location.origin);

            // 1) Mantém parâmetros atuais da URL (UTMs, fbclid etc.)
            const currentParams = new URLSearchParams(window.location.search);
            currentParams.forEach((value, key) => {
                urlObj.searchParams.set(key, value);
            });

            // 2) Completa com UTMs salvos (se faltarem)
            try {
                const stored = (typeof getStoredUTMs === 'function') ? getStoredUTMs() : {};
                Object.keys(stored || {}).forEach((k) => {
                    if (!urlObj.searchParams.has(k)) urlObj.searchParams.set(k, stored[k]);
                });
            } catch (e) {}

            // 3) External ID (eid)
            try {
                const eid = (typeof getExternalId === 'function') ? getExternalId() : null;
                if (eid && !urlObj.searchParams.has('eid')) urlObj.searchParams.set('eid', eid);
            } catch (e) {}

            // 4) fbclid persistido
            try {
                const fbclid = (typeof getFBCLID === 'function') ? getFBCLID() : null;
                if (fbclid && !urlObj.searchParams.has('fbclid')) urlObj.searchParams.set('fbclid', fbclid);
            } catch (e) {}

            return urlObj.toString();
        } catch (e) {
            return baseHref;
        }
    };

    (function setupBuyNowButton() {
        const btn = document.getElementById('buy-now') || document.querySelector('.buy-btn');
        if (!btn) return;

        try {
            btn.href = window.buildCheckoutUrl(btn.getAttribute('href') || btn.href);
        } catch (e) {}

        btn.addEventListener('click', () => {
            try {
                trackViaZaraz('AddToCart', {
                    ...PRODUCT_CONTENT,
                    event_id: generateEventId()
                }, true);
            } catch (e) {}
        }, { passive: true });
    })();
    // ==================================================
    // 4. MICRO-CONVERSÕES (ALIMENTA O ALGORITMO)
    // ==================================================

    // A) Scroll Profundo (Leitura)
    let scroll50Fired = false;
    window.addEventListener('scroll', function() {
        if (scroll50Fired) return;
        const scrollPercentage = (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight * 100;
        if (scrollPercentage >= 50) {
            scroll50Fired = true;
            trackViaZaraz('ScrollDepth', {
                event_id: generateEventId(),
                depth: '50%'
            });
        }
    }, { passive: true });

// ==================================================
  // 2. FUNÇÕES VISUAIS DA LOJA (UI/UX)
  // ==================================================
  
  function showTab(tabName) {
    document.querySelectorAll('.content-section').forEach(section => {
      section.classList.remove('active');
    });
    document.querySelectorAll('.tabs .tab').forEach(tab => {
      tab.classList.remove('active');
    });
    
    const targetContent = document.getElementById(tabName);
    if (targetContent) targetContent.classList.add('active');
    
    const targetTab = document.querySelector(`.tabs .tab[onclick="showTab('${tabName}')"]`);
    if (targetTab) targetTab.classList.add('active');
  }

  const variantLinks = {
    'preto': '/checkout/',
    'rosa-pink': '/checkout/',
    'roxo-claro': '/checkout/',
    'rosa-claro': '/checkout/'
  };
  const buyBtn = document.querySelector('.buy-btn');

  document.addEventListener("DOMContentLoaded", () => {
    
    function startCountdown() {
      const countdownEl = document.getElementById('countdown-timer');
      if (!countdownEl) return;
      
      let savedTime = localStorage.getItem('offer_timer_v2');
      let timeLeft = savedTime ? parseInt(savedTime) : 300;
      
      if(isNaN(timeLeft) || timeLeft <= 0) timeLeft = 300;

      const updateDisplay = () => {
          const minutes = Math.floor(timeLeft / 60);
          const seconds = timeLeft % 60;
          countdownEl.textContent = `Termina em ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      };

      updateDisplay();

      const timerInterval = setInterval(() => {
        if (timeLeft <= 0) {
          timeLeft = 300; 
        } else {
          timeLeft--;
        }
        localStorage.setItem('offer_timer_v2', timeLeft);
        updateDisplay();
      }, 1000);
    }
    
    function updateShippingDate() {
      const shippingEl = document.getElementById('shipping-date');
      if (!shippingEl) return;

      const getDeliveryDate = (addDays) => {
        const date = new Date();
        date.setDate(date.getDate() + addDays);
        const day = date.getDate();
        const month = date.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
        return `${day} de ${month}`;
      };

      const startDate = getDeliveryDate(3);
      const endDate = getDeliveryDate(5);
      shippingEl.textContent = `Receba entre ${startDate} e ${endDate}`;
    }

    const totalImages = 8;
    const variantStartIndex = {
      'preto': 1,
      'rosa-pink': 2,
      'roxo-claro': 3,
      'rosa-claro': 4
    };
    let currentVariant = 'preto';
    let currentImageIndex = variantStartIndex[currentVariant];

    const mainImage = document.getElementById('main-product-image');
    const imageCounter = document.getElementById('image-counter');
    const imageDots = document.getElementById('image-dots');
    const imageThumbnails = document.getElementById('image-thumbnails');
    const swatches = document.querySelectorAll('.color-swatch');
    const viewReviewsBtn = document.querySelector('.add-cart-btn');
    const reviewsSection = document.querySelector('.reviews-section');
    
    if (mainImage) {
        mainImage.onload = function() {
            const loader = document.getElementById('image-loading');
            if(loader) loader.style.display = 'none';
        }
    }

    if (viewReviewsBtn && reviewsSection) {
      viewReviewsBtn.addEventListener('click', (e) => {
        if(window.trackViaZaraz) {
            window.trackViaZaraz('Check_Reviews', { event_id: window.generateEventId() });
        }
        requestAnimationFrame(() => {
            reviewsSection.scrollIntoView({ behavior: 'auto', block: 'start' });
            showTab('overview');
        });
      }, { passive: true });
    }

    const padZero = n => n.toString().padStart(2, '0');

    function createImageDots() {
      imageDots.innerHTML = '';
      for (let i = 1; i <= totalImages; i++) {
        const dot = document.createElement('div');
        dot.classList.add('dot');
        dot.dataset.index = i;
        dot.addEventListener('click', () => {
          currentImageIndex = i;
          updateImageDisplay();
        });
        imageDots.appendChild(dot);
      }
    }
    
   function createThumbnails() {
      imageThumbnails.innerHTML = '';
      for (let i = 1; i <= totalImages; i++) {
        const thumbWrapper = document.createElement('div');
        thumbWrapper.classList.add('thumbnail');
        thumbWrapper.dataset.index = i;
        
        const thumbImg = document.createElement('img');
        const imgName = 'thumb_' + padZero(i) + '.webp'; 
        
        thumbImg.src = '/assets/img/' + imgName;
        thumbImg.alt = `Miniatura ${i}`;
        thumbImg.width = 60;
        thumbImg.height = 60;
        thumbImg.loading = i <= 4 ? 'eager' : 'lazy';
        
        thumbWrapper.appendChild(thumbImg);
        thumbWrapper.addEventListener('click', () => {
          currentImageIndex = i;
          updateImageDisplay();
        });
        imageThumbnails.appendChild(thumbWrapper);
      }
    }

    function updateImageDisplay() {
        requestAnimationFrame(() => {
          const imgName = padZero(currentImageIndex) + '.webp';
          mainImage.src = '/assets/img/' + imgName;
          imageCounter.textContent = `${currentImageIndex}/${totalImages}`;

          imageDots.querySelectorAll('.dot').forEach((d, i) =>
            d.classList.toggle('active', i + 1 === currentImageIndex));

          imageThumbnails.querySelectorAll('.thumbnail').forEach((t, i) =>
            t.classList.toggle('active', i + 1 === currentImageIndex));
      });
    }

    window.changeImage = function(dir) {
      currentImageIndex += dir;
      if (currentImageIndex > totalImages) currentImageIndex = 1;
      if (currentImageIndex < 1) currentImageIndex = totalImages;
      updateImageDisplay();
    };

    swatches.forEach(swatch => {
      swatch.addEventListener('click', () => {
        swatches.forEach(s => s.classList.remove('selected'));
        swatch.classList.add('selected');
        const color = swatch.dataset.color;
        
        if (variantLinks[color]) {
          buyBtn.href = (window.buildCheckoutUrl ? window.buildCheckoutUrl(variantLinks[color]) : variantLinks[color]);
        }
        
        currentVariant = color;
        currentImageIndex = variantStartIndex[color] || 1;
        updateImageDisplay();
      });
    });

    const defaultSwatch = document.querySelector(`.color-swatch[data-color="${currentVariant}"]`);
    if (defaultSwatch) {
        defaultSwatch.classList.add('selected');
        if (variantLinks[currentVariant]) buyBtn.href = (window.buildCheckoutUrl ? window.buildCheckoutUrl(variantLinks[currentVariant]) : variantLinks[currentVariant]);
    }

    createImageDots();
    createThumbnails();
    updateImageDisplay();
    startCountdown();     
    updateShippingDate(); 
    
    const imgContainer = document.querySelector('.image-container');
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    
    let galleryEventFired = false;

    if (imgContainer) {
        imgContainer.addEventListener('touchstart', (e) => {
          touchStartX = e.changedTouches[0].screenX;
          touchStartY = e.changedTouches[0].screenY;
        }, {passive: true});

        imgContainer.addEventListener('touchend', (e) => {
          touchEndX = e.changedTouches[0].screenX;
          touchEndY = e.changedTouches[0].screenY;
          handleSwipe();
        }, {passive: true});
    }

    function handleSwipe() {
      const xDiff = touchEndX - touchStartX;
      const yDiff = touchEndY - touchStartY;
      
      if (Math.abs(xDiff) > 50 && Math.abs(xDiff) > Math.abs(yDiff)) {
        if (xDiff < 0) window.changeImage(1);
        else window.changeImage(-1);
        
        if (!galleryEventFired && window.trackViaZaraz) {
            galleryEventFired = true;
            window.trackViaZaraz('Interact_Gallery', { event_id: window.generateEventId() });
        }
      }
    }
    
    // =============================================
    // IZZAT MODAL SYSTEM (Zero-Redirect, DOM-only)
    // =============================================

    window.__izzatOpenSheet = function(id) {
        var sheet = document.getElementById(id);
        if (!sheet) return;
        sheet.classList.add('active');
        document.body.style.overflow = 'hidden';
    };
    window.__izzatCloseSheet = function(id) {
        var sheet = document.getElementById(id);
        if (!sheet) return;
        sheet.classList.remove('active');
        var anyOpen = document.querySelector('.izzat-bottomsheet.active, .izzat-overlay.active');
        if (!anyOpen) document.body.style.overflow = '';
    };

    (function initLightbox() {
        var overlay = document.getElementById('izzat-lightbox');
        var lightboxImg = document.getElementById('lightbox-img');
        var closeBtn = document.getElementById('lightbox-close');
        if (!overlay || !lightboxImg) return;

        function openLightbox(src) {
            lightboxImg.src = src;
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
        function closeLightbox() {
            overlay.classList.remove('active');
            document.body.style.overflow = '';
            setTimeout(function(){ lightboxImg.src = ''; }, 300);
        }

        document.querySelectorAll('.review-image img').forEach(function(img) {
            img.style.cursor = 'zoom-in';
            img.addEventListener('click', function(e) {
                e.stopPropagation();
                openLightbox(this.src);
            });
        });

        overlay.addEventListener('click', function(e) {
            if (e.target === overlay || e.target === closeBtn || closeBtn.contains(e.target)) {
                closeLightbox();
            }
        });
        closeBtn.addEventListener('click', closeLightbox);
    })();

    (function initTrustSheet() {
        var trigger = document.getElementById('seller-trust-trigger');
        var sheetId = 'izzat-trust-sheet';
        var backdrop = document.getElementById('trust-sheet-backdrop');
        var closeBtn = document.getElementById('trust-sheet-close');
        if (!trigger) return;

        trigger.addEventListener('click', function() {
            window.__izzatOpenSheet(sheetId);
        });
        if (backdrop) backdrop.addEventListener('click', function() {
            window.__izzatCloseSheet(sheetId);
        });
        if (closeBtn) closeBtn.addEventListener('click', function() {
            window.__izzatCloseSheet(sheetId);
        });
    })();

    (function initMenuSheet() {
        var trigger = document.getElementById('header-menu-trigger');
        var sheetId = 'izzat-menu-sheet';
        var backdrop = document.getElementById('menu-sheet-backdrop');
        var closeBtn = document.getElementById('menu-sheet-close');
        if (!trigger) return;

        trigger.addEventListener('click', function() {
            window.__izzatOpenSheet(sheetId);
        });
        if (backdrop) backdrop.addEventListener('click', function() {
            window.__izzatCloseSheet(sheetId);
        });
        if (closeBtn) closeBtn.addEventListener('click', function() {
            window.__izzatCloseSheet(sheetId);
        });
    })();

    window.__izzatMenuNav = function(href) {
        window.__izzatCloseSheet('izzat-menu-sheet');
        setTimeout(function() {
            window.location.href = href;
        }, 200);
    };

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            var lightbox = document.getElementById('izzat-lightbox');
            if (lightbox && lightbox.classList.contains('active')) {
                lightbox.classList.remove('active');
                document.body.style.overflow = '';
                return;
            }
            document.querySelectorAll('.izzat-bottomsheet.active').forEach(function(sheet) {
                sheet.classList.remove('active');
            });
            document.body.style.overflow = '';
        }
    });

    // Pop-up de Vendas
    const buyers = [
        { name: "Fernanda Maia", city: "Rio de Janeiro, RJ", img: "/assets/img/foto1.webp" },
        { name: "Bruna Lima", city: "São Paulo, SP", img: "/assets/img/foto2.webp" },
        { name: "Marilia Lima", city: "Belo Horizonte, MG", img: "/assets/img/foto3.webp" },
        { name: "Karina Andrade", city: "Curitiba, PR", img: "/assets/img/foto4.webp" },
        { name: "Bruna Silva", city: "Salvador, BA", img: "/assets/img/foto5.webp" },
        { name: "Kailane Cristina", city: "Fortaleza, CE", img: "/assets/img/foto6.webp" },
        { name: "Mariana Lemos", city: "Porto Alegre, RS", img: "/assets/img/foto7.webp" }
    ];

    const actions = [
        "Comprou agora mesmo",
        "Acabou de comprar",
        "Comprou há 2 minutos",
        "Garantiu a oferta",
        "Comprou 2 unidades"
    ];

    function showSalesPopup() {
        const popup = document.getElementById('sales-popup');
        const imgEl = document.getElementById('popup-img');
        const nameEl = document.getElementById('popup-name');
        const cityEl = document.getElementById('popup-city');
        const actionEl = document.getElementById('popup-action');

        if (!popup) return;

        var container = document.querySelector('.container');
        if (container && window.innerWidth > 480) {
            var rect = container.getBoundingClientRect();
            popup.style.left = (rect.left + 10) + 'px';
            popup.style.maxWidth = Math.min(rect.width - 20, 460) + 'px';
        }

        const randomBuyer = buyers[Math.floor(Math.random() * buyers.length)];
        const randomAction = actions[Math.floor(Math.random() * actions.length)];

        nameEl.textContent = randomBuyer.name;
        cityEl.textContent = randomBuyer.city;
        actionEl.textContent = randomAction;
        if(randomBuyer.img) imgEl.src = randomBuyer.img;

        popup.classList.add('visible');

        setTimeout(() => {
            popup.classList.remove('visible');
        }, 4000);
    }

    setTimeout(() => {
        showSalesPopup();
        setInterval(showSalesPopup, 10000); 
    }, 3000);
    
  });

