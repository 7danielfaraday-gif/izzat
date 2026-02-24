# Receber pedidos do checkout por e-mail (Cloudflare Pages)

O checkout já chama `POST /api/order` quando o cliente finaliza e vai pra tela do PIX.
Esta função (`/functions/api/order.js`) envia um e-mail com os dados do pedido.

## 1) Secret obrigatório
No Cloudflare Pages:
Pages → Settings → Environment variables → (Production) → **Add variable (Secret)**

- **ORDER_NOTIFY_TO** = seu e-mail que vai receber os pedidos

✅ Pronto. Só isso já funciona.

## 2) Secret opcional (recomendado)
- **ORDER_NOTIFY_FROM** = um e-mail do seu domínio (ex: pedidos@loja.izzat.shop)

Se você NÃO criar, o sistema usa automaticamente:
- `pedidos@SEU_DOMINIO`

## 3) SPF (recomendado para não cair no spam)
No DNS (Cloudflare) crie um TXT no @:

v=spf1 include:mailchannels.net -all

## Teste rápido
1) Abra o checkout
2) Preencha e clique em FINALIZAR
3) Você deve receber: "Novo pedido (PIX pendente) — ord_..."
