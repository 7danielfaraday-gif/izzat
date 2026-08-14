# Izzat Express

Loja e checkout em vinext, preparados para o runtime da Cloudflare Workers e persistência no Workers KV.

## Desenvolvimento local

```bash
npm install
npm run dev
npm run build
```

Copie `.dev.vars.example` para `.dev.vars` e defina uma senha administrativa e uma chave de sessão antes de testar o painel. No ambiente local, o binding `IZZAT_STORE` é simulado automaticamente. O navegador mantém uma cópia de contingência para que o painel continue utilizável quando a rede estiver indisponível.

## Publicação pelo GitHub na Cloudflare

Este projeto é uma aplicação completa em Cloudflare Workers, não uma exportação estática do Pages. O Worker entrega a loja, o checkout SPA, as APIs, o painel e os arquivos públicos no mesmo endereço.

1. Envie o repositório para o GitHub, preferencialmente como privado.
2. Na Cloudflare, abra **Workers & Pages → Create application → Import a repository** e conecte o repositório.
3. Use a branch de produção `main`, diretório raiz `/`, comando de build `npm run build` e comando de deploy `npx wrangler deploy`.
4. Em **Build variables**, defina `NODE_VERSION` como `22.13.0`.
5. O primeiro deploy provisiona o namespace KV declarado como `IZZAT_STORE`. Se a conta já possuir um namespace com dados, associe o ID dele ao binding antes do deploy inicial.
6. Em **Settings → Variables and Secrets**, adicione como secrets `IZZAT_ADMIN_PASSWORD` e `IZZAT_ADMIN_SESSION_SECRET`. Adicione também `CF_ACCESS_TEAM_DOMAIN` e `CF_ACCESS_AUD` caso use a camada opcional do Cloudflare Access.
7. Depois do primeiro deploy, teste `/`, um produto, o checkout, a geração do Pix e `/admin` antes de conectar o domínio definitivo.

Os arquivos de publicação estão versionados em `wrangler.jsonc`; o build gera automaticamente o Worker final e aponta o binding de assets para o pacote do site. Novos commits enviados à branch `main` passam a gerar novos deploys automaticamente.

Nunca salve senhas, tokens de Pixel ou chaves de API no GitHub. Credenciais administrativas ficam nos Secrets da Cloudflare e credenciais server-side de rastreamento permanecem no KV.

O KV guarda produtos, preços, estoque, galerias, checkout individual, códigos Pix, avaliações e configurações visuais. O projeto não depende mais do D1 para o catálogo.

## Pixels e Google Analytics por produto

Cada produto possui sua própria configuração de Pixel e API no painel. Enquanto o ID estiver vazio ou a opção estiver desligada, nenhum script ou evento daquela plataforma é carregado.

Para habilitar o envio pelo servidor, crie no mesmo namespace `IZZAT_STORE` uma chave para cada Pixel ativo. O valor deve ser um JSON.

Meta / Facebook:

- Chave: `izzat:tracking:meta:ID_DO_PIXEL`
- Valor: `{"accessToken":"TOKEN_DA_CONVERSIONS_API"}`
- Para testar: `{"accessToken":"TOKEN_DA_CONVERSIONS_API","testEventCode":"TEST12345"}`
- A versão padrão da Graph API é `v23.0`. É possível sobrescrever com `"apiVersion":"v23.0"`.

TikTok:

- Chave: `izzat:tracking:tiktok:ID_DO_PIXEL`
- Valor: `{"accessToken":"TOKEN_DA_EVENTS_API"}`
- Para testar: `{"accessToken":"TOKEN_DA_EVENTS_API","testEventCode":"TEST12345"}`
- A integração envia o mesmo funil pelo Pixel e pela Events API, usando o mesmo `event_id` para deduplicação.
- A correspondência inclui `ttclid`, cookie `_ttp`, identificador externo, IP, User-Agent, e-mail e telefone em SHA-256. O telefone é normalizado em E.164 (`+55...`) antes do hash.
- O `ttclid` é preservado durante toda a navegação SPA e o identificador externo não contém e-mail, telefone ou outro dado pessoal legível.
- No TikTok Events Manager, ative também **Automatic Advanced Matching** e **First-party cookies** para completar a cobertura.
- O SDK só é baixado nos produtos em que o Pixel está ativo, com carregamento assíncrono; produtos sem TikTok configurado não pagam esse custo de rede.

Google Analytics 4:

- Informe o ID de medição `G-XXXXXXXXXX` diretamente no produto e ative **Google tag no navegador**.
- Para complementar a geração do Pix com envio server-side, crie a chave `izzat:tracking:google:G-XXXXXXXXXX`.
- Valor: `{"apiSecret":"API_SECRET_DO_MEASUREMENT_PROTOCOL"}`.
- O API Secret é criado no Google Analytics em **Administrador → Fluxos de dados → Measurement Protocol**.
- Se ambos estiverem ativos, o funil é medido pela Google tag e o evento `pix_generated` é enviado pelo servidor, sem duplicidade.
- O Measurement Protocol complementa a Google tag; mantenha a tag ativa para relatórios completos de dispositivo, sessão e atribuição.

Eventos preparados:

- Página do produto: `ViewContent`.
- Abertura do checkout: `InitiateCheckout`.
- Formulário válido enviado: `AddPaymentInfo`.
- Código Pix exibido: TikTok `CompletePayment` e Meta `PixGenerated`.
- No GA4: `view_item`, `begin_checkout`, `add_payment_info` e `pix_generated`.

O evento `pix_generated` indica que o cliente visualizou o código Pix. Ele não é enviado como `purchase`, pois a exibição do código ainda não comprova que o pagamento foi concluído no banco. Esse evento pode ser marcado como evento principal no GA4.

O mesmo `event_id` é enviado pelo navegador e pela API para deduplicação. E-mail e telefone são normalizados e transformados em SHA-256 antes de sair do servidor. Tokens nunca são devolvidos ao navegador nem armazenados no cadastro público do produto.

## Proteção do painel com Cloudflare Access

Proteja no Cloudflare Access os caminhos `/admin*` e `/api/admin/*` para permitir somente o seu usuário. Depois adicione ao ambiente de produção:

- `CF_ACCESS_TEAM_DOMAIN`: por exemplo, `https://sua-equipe.cloudflareaccess.com`
- `CF_ACCESS_AUD`: o **Application Audience (AUD) Tag** do aplicativo Access

O Cloudflare Access pode continuar como uma primeira camada externa. A aplicação também exige a sessão do login próprio antes de abrir o painel ou aceitar qualquer gravação no KV.

## Login próprio do painel

O caminho `/admin` também exige uma senha própria e cria uma sessão segura com duração de 12 horas. Adicione como **Secrets** no ambiente de produção e, se desejar, no Preview:

- `IZZAT_ADMIN_PASSWORD`: a senha que você usará para entrar no painel.
- `IZZAT_ADMIN_SESSION_SECRET`: uma chave aleatória com pelo menos 32 caracteres, diferente da senha.

Depois faça um novo deploy. Não coloque essas informações no código, no KV público ou em variáveis expostas ao navegador. O login limita tentativas incorretas por 15 minutos e a gravação em `/api/admin/store` exige a mesma sessão autenticada.

Use URLs de imagens sempre que possível. Uploads enviados diretamente pelo painel são incorporados ao documento e contam no limite de tamanho do KV.

## Estrutura da API

- `GET /api/store`: catálogo e configurações públicas.
- `GET /api/products`: compatibilidade com a leitura do catálogo.
- `POST /api/admin/store`: gravação protegida do painel.
- `POST /api/tracking/events`: encaminhamento protegido para Meta Conversions API, TikTok Events API e Google Measurement Protocol.
- Binding KV: `IZZAT_STORE`.
- Chave principal: `izzat:store:v1`.
