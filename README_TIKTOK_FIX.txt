CORREÇÃO – TikTok Pixel Híbrido (Zaraz como fonte única)

O que foi corrigido no código:
- Removido o snippet do TikTok Pixel (ttq.load/ttq.page) do HTML:
  - /index.html
  - /checkout.html
  - /checkout/index.html
- Removidas as chamadas diretas ao Pixel no navegador (ttq.track) e mantido apenas:
  - zaraz.track(event, payload)

Por que isso resolve:
- Você estava com 2/3 fontes enviando o mesmo evento (Pixel do HTML + JS + Zaraz),
  o que causa:
  - mismatch de event_id entre navegador/servidor (deduplicação baixa)
  - parte dos ViewContent chegando sem content_id (vindo do disparo extra)

Como usar (recomendado):
1) Mantenha o TikTok ATIVADO no Cloudflare Zaraz (Ferramentas de terceiros -> TikTok)
   com Pixel Code + Access Token.
2) Garanta que NÃO exista outra integração duplicada (GTM/Events Builder/Outro Pixel).
3) Após publicar, valide em:
   TikTok Events Manager -> Test Events
   - ViewContent deve chegar com content_id
   - Eventos não devem duplicar para a mesma ação

Importante:
- Se o Access Token apareceu publicamente (print/compartilhamento), gere um novo no TikTok
  e atualize no Zaraz.

