IMPORTANTE (Cloudflare Pages Functions)

Se voce fizer deploy pelo botao "Create deployment" (upload pelo dashboard), as Functions NAO sao publicadas.
Voce precisa publicar via:
  1) Git Integration (conectar o repo no Pages), OU
  2) Wrangler CLI (wrangler pages deploy) apontando para esta pasta.

Teste rapido apos publicar corretamente:
  /api/ping  -> deve retornar JSON com pong=true.
  /api/pix-config -> deve retornar JSON ok=true.
  /api/pix-config-admin -> deve pedir usuario/senha (Basic Auth).

Depois que /api/ping funcionar, abra /admin/pix-panel.html (ou /admin/pix-panel) e salve o PIX.
A chave no KV sera criada automaticamente.
