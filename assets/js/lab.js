/**
 * 🔬 TikTok In-Browser Lab Mode
 * ──────────────────────────────
 * Ativado via ?lab=1 na URL (persiste via sessionStorage).
 * Bloqueia todos os scripts de tracking e injeta um painel
 * visual de diagnóstico para depurar problemas no in-app browser.
 */
(function () {
  'use strict';

  // ─── 1. Detecção & Persistência ──────────────────────────────
  var params = new URLSearchParams(window.location.search);
  var isLab = params.has('lab');
  try {
    if (!isLab) isLab = sessionStorage.getItem('__lab_mode') === '1';
    if (isLab) sessionStorage.setItem('__lab_mode', '1');
  } catch (e) {}

  if (!isLab) return;
  window.__LAB_MODE = true;
  window.__TEST_MODE = true; // reaproveita guard existente nos scripts de prod

  // ─── 2. Dados do Lab ─────────────────────────────────────────
  var _checks = [];   // { label, status: 'ok'|'fail'|'wait', detail? }
  var _logs = [];      // { time, msg, type: 'info'|'ok'|'warn'|'err'|'block' }
  var _panelEl = null;
  var _checksEl = null;
  var _logsEl = null;
  var _minimized = false;

  function ts() {
    var d = new Date();
    return String(d.getHours()).padStart(2, '0') + ':' +
           String(d.getMinutes()).padStart(2, '0') + ':' +
           String(d.getSeconds()).padStart(2, '0');
  }

  function addCheck(label, status, detail) {
    for (var i = 0; i < _checks.length; i++) {
      if (_checks[i].label === label) {
        _checks[i].status = status;
        _checks[i].detail = detail || '';
        renderChecks();
        return;
      }
    }
    _checks.push({ label: label, status: status, detail: detail || '' });
    renderChecks();
  }

  function log(msg, type) {
    type = type || 'info';
    _logs.push({ time: ts(), msg: msg, type: type });
    if (_logs.length > 200) _logs.shift();
    renderLogs();
  }

  // ─── 3. Bloqueio de Tracking ─────────────────────────────────

  // 3a. Stub completo do TikTok Pixel (ttq)
  var ttqStub = {
    page: function () { log('ttq.page() → BLOQUEADO', 'block'); },
    track: function (ev, data) { log('ttq.track("' + ev + '") → BLOQUEADO', 'block'); },
    identify: function () { log('ttq.identify() → BLOQUEADO', 'block'); },
    load: function (id) { log('ttq.load("' + id + '") → BLOQUEADO', 'block'); },
    instance: function () { return ttqStub; },
    instances: function () { return []; },
    debug: function () {},
    on: function () {},
    off: function () {},
    once: function () {},
    ready: function () {},
    alias: function () {},
    group: function () {},
    enableCookie: function () {},
    disableCookie: function () {},
    push: function () {},
    methods: [],
    setAndDefer: function () {},
    _i: {},
    _t: {},
    _o: {},
    q: []
  };
  window.ttq = ttqStub;
  try {
    Object.defineProperty(window, 'ttq', {
      get: function () { return ttqStub; },
      set: function () { log('⛔ Tentativa de sobrescrever ttq → BLOQUEADO', 'block'); },
      configurable: false
    });
  } catch (e) {}

  // 3b. Stub Clarity
  window.clarity = function () { log('clarity() → BLOQUEADO', 'block'); };
  try {
    Object.defineProperty(window, 'clarity', {
      get: function () { return function () { log('clarity() → BLOQUEADO', 'block'); }; },
      set: function () { log('⛔ Tentativa de carregar Clarity → BLOQUEADO', 'block'); },
      configurable: false
    });
  } catch (e) {}

  // 3c. Interceptar fetch (bloqueia CAPI + metrics)
  var _origFetch = window.fetch;
  window.fetch = function (url) {
    var u = typeof url === 'string' ? url : (url && url.url ? url.url : '');
    if (/\/api\/tiktok-events/i.test(u)) {
      log('fetch → /api/tiktok-events BLOQUEADO', 'block');
      return Promise.resolve(new Response('{}', { status: 200 }));
    }
    if (/\/api\/metrics\/ping/i.test(u)) {
      log('fetch → /api/metrics/ping BLOQUEADO', 'block');
      return Promise.resolve(new Response('{}', { status: 200 }));
    }
    if (/analytics\.tiktok\.com/i.test(u)) {
      log('fetch → analytics.tiktok.com BLOQUEADO', 'block');
      return Promise.resolve(new Response('{}', { status: 200 }));
    }
    if (/clarity\.ms/i.test(u)) {
      log('fetch → clarity.ms BLOQUEADO', 'block');
      return Promise.resolve(new Response('{}', { status: 200 }));
    }
    if (/googletagmanager\.com/i.test(u)) {
      log('fetch → GTM BLOQUEADO', 'block');
      return Promise.resolve(new Response('{}', { status: 200 }));
    }
    return _origFetch.apply(this, arguments);
  };

  // 3d. Interceptar sendBeacon
  if (navigator.sendBeacon) {
    var _origBeacon = navigator.sendBeacon.bind(navigator);
    navigator.sendBeacon = function (url, data) {
      if (/\/api\/metrics/i.test(url) || /tiktok/i.test(url)) {
        log('sendBeacon → ' + url + ' BLOQUEADO', 'block');
        return true;
      }
      return _origBeacon(url, data);
    };
  }

  // 3e. MutationObserver para bloquear scripts de tracking injetados dinamicamente
  var blockedDomains = ['analytics.tiktok.com', 'clarity.ms', 'googletagmanager.com', 'google-analytics.com'];
  try {
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        m.addedNodes.forEach(function (node) {
          if (node.tagName === 'SCRIPT' && node.src) {
            for (var i = 0; i < blockedDomains.length; i++) {
              if (node.src.indexOf(blockedDomains[i]) !== -1) {
                node.type = 'text/blocked';
                node.src = '';
                try { node.parentNode.removeChild(node); } catch (e) {}
                log('⛔ Script bloqueado: ' + blockedDomains[i], 'block');
              }
            }
          }
        });
      });
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  } catch (e) {}

  // 3f. Bloqueia gtag
  window.gtag = function () { log('gtag() → BLOQUEADO', 'block'); };
  window.dataLayer = [];

  // ─── 4. Interceptores de Funções-Chave ───────────────────────

  // 4a. Interceptar trackPixel (wrapper que loga em vez de enviar)
  var _checkTrackPixel = setInterval(function () {
    if (typeof window.trackPixel === 'function' && !window.trackPixel.__labWrapped) {
      var _orig = window.trackPixel;
      window.trackPixel = function (event, data) {
        log('trackPixel("' + event + '") → capturado (não enviado)', 'info');
        if (data && data.event_id) log('  event_id: ' + data.event_id, 'info');
        if (event === 'CompletePayment') addCheck('Evento CompletePayment', 'ok');
        if (event === 'ViewContent') addCheck('Evento ViewContent', 'ok');
        if (event === 'InitiateCheckout') addCheck('Evento InitiateCheckout', 'ok');
        if (event === 'AddPaymentInfo') addCheck('Evento AddPaymentInfo', 'ok');
        if (event === 'Pix_Copy_Click') addCheck('Evento Pix_Copy_Click', 'ok');
        if (event === 'Checkout_Error') {
          addCheck('Erro no checkout', 'warn', data && data.error_field ? data.error_field : '');
          log('  Erro campo: ' + (data && data.error_field || '?') + ' → ' + (data && data.error_message || ''), 'warn');
        }
      };
      window.trackPixel.__labWrapped = true;
      log('✅ trackPixel interceptado com sucesso', 'ok');
      clearInterval(_checkTrackPixel);
    }
  }, 50);
  setTimeout(function () { clearInterval(_checkTrackPixel); }, 15000);

  // 4b. Interceptar safeCopyToClipboard
  var _checkCopy = setInterval(function () {
    if (typeof window.safeCopyToClipboard === 'function' && !window.safeCopyToClipboard.__labWrapped) {
      var _origCopy = window.safeCopyToClipboard;
      window.safeCopyToClipboard = function (text) {
        log('📋 safeCopyToClipboard chamado', 'info');
        log('  Texto (' + text.length + ' chars): ' + text.substring(0, 60) + '...', 'info');
        addCheck('PIX Copy tentado', 'wait');
        return _origCopy(text).then(function () {
          addCheck('PIX Copy tentado', 'ok', 'Sucesso!');
          log('✅ Clipboard: texto copiado com sucesso', 'ok');

          // Verificação: ler o clipboard e comparar
          try {
            if (navigator.clipboard && navigator.clipboard.readText) {
              navigator.clipboard.readText().then(function (clipText) {
                if (clipText === text) {
                  log('✅ Verificação clipboard: TEXTO IDÊNTICO', 'ok');
                  addCheck('PIX no clipboard correto', 'ok');
                } else {
                  log('⚠️ Clipboard difere! Esperado: ' + text.substring(0, 40) + '...', 'warn');
                  log('⚠️ Recebido: ' + clipText.substring(0, 40) + '...', 'warn');
                  addCheck('PIX no clipboard correto', 'fail', 'Texto alterado!');
                }
              }).catch(function () {
                log('ℹ️ Não foi possível verificar clipboard (permissão negada)', 'info');
              });
            }
          } catch (e) {}
        }).catch(function (err) {
          addCheck('PIX Copy tentado', 'fail', 'Falhou!');
          log('❌ Clipboard FALHOU: ' + (err && err.message || err), 'err');
          return Promise.reject(err);
        });
      };
      window.safeCopyToClipboard.__labWrapped = true;
      log('✅ safeCopyToClipboard interceptado', 'ok');
      clearInterval(_checkCopy);
    }
  }, 50);
  setTimeout(function () { clearInterval(_checkCopy); }, 15000);

  // 4c. Interceptar initReactCheckout
  var _checkInit = setInterval(function () {
    if (typeof window.initReactCheckout === 'function' && !window.initReactCheckout.__labWrapped) {
      var _origInit = window.initReactCheckout;
      window.initReactCheckout = function () {
        log('🚀 initReactCheckout() chamado', 'ok');
        addCheck('initReactCheckout()', 'ok');
        return _origInit.apply(this, arguments);
      };
      window.initReactCheckout.__labWrapped = true;
      clearInterval(_checkInit);
    }
  }, 50);
  setTimeout(function () { clearInterval(_checkInit); }, 15000);

  // ─── 5. Checkpoints de ciclo de vida ─────────────────────────

  // DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      addCheck('DOMContentLoaded', 'ok');
      log('📄 DOMContentLoaded disparado', 'ok');
    });
  } else {
    addCheck('DOMContentLoaded', 'ok', 'Já carregado');
    log('📄 DOM já estava pronto', 'ok');
  }

  // window.load
  window.addEventListener('load', function () {
    addCheck('window.onload', 'ok');
    log('🌐 window.onload disparado', 'ok');
  });

  // Polling para React, ReactDOM, checkout
  addCheck('React carregou', 'wait');
  addCheck('ReactDOM carregou', 'wait');
  addCheck('Checkout montado', 'wait');

  var _poll = setInterval(function () {
    if (typeof window.React !== 'undefined') addCheck('React carregou', 'ok');
    if (typeof window.ReactDOM !== 'undefined') addCheck('ReactDOM carregou', 'ok');
    if (window.checkoutInitialized) {
      addCheck('Checkout montado', 'ok');
      log('✅ Checkout React montado com sucesso', 'ok');
    }
    if (window.checkoutMounted) addCheck('Checkout renderizado no DOM', 'ok');

    // Checar se skeleton sumiu
    var sk = document.getElementById('skeleton-loader');
    if (sk && (sk.style.display === 'none' || sk.style.opacity === '0')) {
      addCheck('Skeleton removido', 'ok');
    }

    // Tudo pronto? para polling
    if (window.React && window.ReactDOM && window.checkoutInitialized) {
      clearInterval(_poll);
    }
  }, 300);
  setTimeout(function () { clearInterval(_poll); }, 30000);

  // ─── 6. Painel Visual ────────────────────────────────────────

  function detectEnv() {
    var ua = navigator.userAgent || '';
    var env = '🖥️ Desktop Browser';
    if (/TikTok/i.test(ua)) env = '📱 TikTok In-App Browser';
    else if (/Instagram/i.test(ua)) env = '📱 Instagram In-App Browser';
    else if (/FBAV|FBAN|FB_IAB/i.test(ua)) env = '📱 Facebook In-App Browser';
    else if (/Twitter|X-App/i.test(ua)) env = '📱 Twitter/X In-App Browser';
    else if (/Android.*wv\)/i.test(ua)) env = '📱 Android WebView';
    else if (/iPhone|iPad/i.test(ua) && !/Safari/i.test(ua)) env = '📱 iOS WebView';
    else if (/iPhone|iPad|Android/i.test(ua)) env = '📱 Mobile Browser';
    return env;
  }

  function getStatusIcon(s) {
    if (s === 'ok') return '✅';
    if (s === 'fail') return '❌';
    if (s === 'warn') return '⚠️';
    return '⏳';
  }

  function getLogColor(type) {
    if (type === 'ok') return '#4ade80';
    if (type === 'warn') return '#fbbf24';
    if (type === 'err') return '#f87171';
    if (type === 'block') return '#c084fc';
    return '#94a3b8';
  }

  function renderChecks() {
    if (!_checksEl) return;
    var html = '';
    for (var i = 0; i < _checks.length; i++) {
      var c = _checks[i];
      html += '<div style="padding:2px 0;font-size:11px;display:flex;align-items:center;gap:5px;">' +
              '<span>' + getStatusIcon(c.status) + '</span>' +
              '<span style="color:#e2e8f0;">' + c.label + '</span>' +
              (c.detail ? '<span style="color:#94a3b8;font-size:10px;margin-left:auto;">' + c.detail + '</span>' : '') +
              '</div>';
    }
    _checksEl.innerHTML = html;
  }

  function renderLogs() {
    if (!_logsEl) return;
    var html = '';
    // Mostra os últimos 50
    var start = Math.max(0, _logs.length - 50);
    for (var i = start; i < _logs.length; i++) {
      var l = _logs[i];
      html += '<div style="padding:1px 0;font-size:10px;line-height:1.4;word-break:break-all;">' +
              '<span style="color:#64748b;">[' + l.time + ']</span> ' +
              '<span style="color:' + getLogColor(l.type) + ';">' + l.msg + '</span>' +
              '</div>';
    }
    _logsEl.innerHTML = html;
    _logsEl.scrollTop = _logsEl.scrollHeight;
  }

  function createPanel() {
    var panel = document.createElement('div');
    panel.id = 'lab-panel';
    panel.style.cssText = 'position:fixed;bottom:10px;right:10px;width:340px;max-width:calc(100vw - 20px);' +
      'max-height:70vh;background:rgba(15,23,42,0.96);color:#e2e8f0;font-family:monospace,sans-serif;' +
      'font-size:11px;border-radius:12px;z-index:999999;overflow:hidden;box-shadow:0 25px 50px rgba(0,0,0,0.5);' +
      'backdrop-filter:blur(20px);border:1px solid rgba(148,163,184,0.15);display:flex;flex-direction:column;' +
      'transition:all 0.3s ease;';

    // Header
    var header = document.createElement('div');
    header.style.cssText = 'padding:10px 14px;background:linear-gradient(135deg,rgba(34,197,94,0.15),rgba(59,130,246,0.1));' +
      'border-bottom:1px solid rgba(148,163,184,0.1);display:flex;justify-content:space-between;align-items:center;cursor:pointer;flex-shrink:0;';
    header.innerHTML = '<div style="display:flex;align-items:center;gap:6px;">' +
      '<span style="font-size:14px;">🔬</span>' +
      '<span style="font-weight:bold;font-size:12px;color:#4ade80;">TikTok Lab Mode</span>' +
      '</div>' +
      '<div id="lab-header-btns" style="display:flex;gap:6px;">' +
      '<button id="lab-clear" style="background:rgba(148,163,184,0.15);border:none;color:#94a3b8;font-size:9px;padding:3px 8px;border-radius:6px;cursor:pointer;">Limpar</button>' +
      '<button id="lab-min" style="background:rgba(148,163,184,0.15);border:none;color:#94a3b8;font-size:14px;padding:0 6px;border-radius:6px;cursor:pointer;line-height:20px;">−</button>' +
      '</div>';

    // Body (scrollable)
    var body = document.createElement('div');
    body.id = 'lab-body';
    body.style.cssText = 'overflow-y:auto;flex:1;min-height:0;';

    // Env section
    var envSection = document.createElement('div');
    envSection.style.cssText = 'padding:10px 14px;border-bottom:1px solid rgba(148,163,184,0.08);';
    var ua = navigator.userAgent || '';
    var uaShort = ua.length > 80 ? ua.substring(0, 80) + '…' : ua;
    envSection.innerHTML = '<div style="font-size:10px;color:#64748b;font-weight:bold;margin-bottom:6px;text-transform:uppercase;letter-spacing:1px;">Ambiente</div>' +
      '<div style="font-size:11px;color:#e2e8f0;margin-bottom:3px;">' + detectEnv() + '</div>' +
      '<div style="font-size:9px;color:#475569;word-break:break-all;">UA: ' + uaShort + '</div>' +
      '<div style="font-size:9px;color:#475569;margin-top:2px;">URL: ' + window.location.pathname + window.location.search + '</div>';

    // Checks section
    var checksSection = document.createElement('div');
    checksSection.style.cssText = 'padding:10px 14px;border-bottom:1px solid rgba(148,163,184,0.08);';
    checksSection.innerHTML = '<div style="font-size:10px;color:#64748b;font-weight:bold;margin-bottom:6px;text-transform:uppercase;letter-spacing:1px;">Status</div>';
    _checksEl = document.createElement('div');
    checksSection.appendChild(_checksEl);

    // Logs section
    var logsSection = document.createElement('div');
    logsSection.style.cssText = 'padding:10px 14px;flex:1;';
    logsSection.innerHTML = '<div style="font-size:10px;color:#64748b;font-weight:bold;margin-bottom:6px;text-transform:uppercase;letter-spacing:1px;">Eventos</div>';
    _logsEl = document.createElement('div');
    _logsEl.style.cssText = 'max-height:200px;overflow-y:auto;';
    logsSection.appendChild(_logsEl);

    body.appendChild(envSection);
    body.appendChild(checksSection);
    body.appendChild(logsSection);

    panel.appendChild(header);
    panel.appendChild(body);
    document.body.appendChild(panel);
    _panelEl = panel;

    // Minimized bubble
    var bubble = document.createElement('div');
    bubble.id = 'lab-bubble';
    bubble.style.cssText = 'position:fixed;bottom:16px;right:16px;width:48px;height:48px;border-radius:50%;' +
      'background:linear-gradient(135deg,#22c55e,#3b82f6);display:none;z-index:999999;cursor:pointer;' +
      'box-shadow:0 8px 25px rgba(34,197,94,0.4);align-items:center;justify-content:center;font-size:20px;' +
      'transition:transform 0.2s;';
    bubble.innerHTML = '🔬';
    bubble.addEventListener('click', function () {
      _minimized = false;
      panel.style.display = 'flex';
      bubble.style.display = 'none';
    });
    document.body.appendChild(bubble);

    // Button handlers
    document.getElementById('lab-min').addEventListener('click', function (ev) {
      ev.stopPropagation();
      _minimized = true;
      panel.style.display = 'none';
      bubble.style.display = 'flex';
    });

    document.getElementById('lab-clear').addEventListener('click', function (ev) {
      ev.stopPropagation();
      _logs = [];
      renderLogs();
    });

    // Initial render
    renderChecks();
    renderLogs();

    log('🔬 Lab Mode ativado — tracking bloqueado', 'ok');
    log('Ambiente: ' + detectEnv(), 'info');
  }

  // Create panel when DOM is ready
  if (document.body) {
    createPanel();
  } else {
    document.addEventListener('DOMContentLoaded', createPanel);
  }

  // ─── 7. Expor API global para debug via console ──────────────
  window.__lab = {
    log: log,
    addCheck: addCheck,
    checks: function () { return _checks; },
    logs: function () { return _logs; }
  };

})();
