(() => {
  const SID_KEY = 'izzat_sid_v1';
  const DOMAIN = '.izzat.shop'; // Garante persistência em toda a estrutura

  const getSid = () => {
    try {
      // Tenta recuperar do Cookie primeiro para maior persistência
      const match = document.cookie.match(new RegExp('(^| )' + SID_KEY + '=([^;]+)'));
      if (match) return match[2];

      const sid = self.crypto && crypto.randomUUID
        ? crypto.randomUUID()
        : Date.now().toString(36) + Math.random().toString(36).slice(2);
      
      // Salva no cookie com validade de 24h e escopo de subdomínio
      document.cookie = `${SID_KEY}=${sid}; path=/; domain=${DOMAIN}; max-age=86400; SameSite=Lax`;
      return sid;
    } catch {
      return Date.now().toString(36) + Math.random().toString(36).slice(2);
    }
  };

  const send = () => {
    // Só envia se o navegador não estiver em segundo plano para poupar recursos
    if (document.visibilityState === 'hidden') return;

    const body = JSON.stringify({ sid: getSid(), path: location.pathname, ts: Date.now() });
    
    // Prioridade máxima para sendBeacon (não bloqueia o carregamento do Zaraz)
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/metrics/ping', body);
    } else {
      fetch('/api/metrics/ping', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {});
    }
  };

  // Redução drástica da frequência: de 20s para 60s
  send();
  setInterval(send, 60000); 
})();