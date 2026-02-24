ADMIN DE PEDIDOS (SEM EMAIL)

1) KV Binding:
   Pages > Settings > Functions > KV bindings
   Binding name: PIX_STORE
   KV Namespace: (o mesmo que você usa no PIX)

2) Secrets:
   PIX_ADMIN_USER = admin (ou o que quiser)
   PIX_ADMIN_PASS = sua senha (obrigatório para proteger a lista)

3) Acesso:
   https://SEU-DOMINIO/admin/pedidos.html

4) API:
   POST /api/order  -> salva pedido no KV (order:<id>)
   GET  /api/orders -> lista pedidos (protegido por Basic Auth)
