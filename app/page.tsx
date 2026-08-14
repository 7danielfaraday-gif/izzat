"use client";

import { lazy, Suspense, type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { trackCheckoutUxEvent, trackProductEvent } from "./tracking";

export type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  oldPrice: number;
  pix: number;
  image: string;
  badge?: string;
  sold: number;
  stock: number;
  featured?: boolean;
  description: string;
  gallery?: string[];
  checkoutTitle?: string;
  checkoutBadge?: string;
  checkoutGuarantee?: string;
  checkoutDelivery?: string;
  pixCode?: string;
  metaPixelId?: string;
  metaPixelEnabled?: boolean;
  metaConversionsApiEnabled?: boolean;
  tiktokPixelId?: string;
  tiktokPixelEnabled?: boolean;
  tiktokEventsApiEnabled?: boolean;
  googleAnalyticsId?: string;
  googleAnalyticsEnabled?: boolean;
  googleMeasurementProtocolEnabled?: boolean;
};

type CartItem = Product & { quantity: number };
type Screen = "home" | "product" | "category" | "admin";

export type Review = {
  id: number;
  productId: number;
  name: string;
  rating: number;
  comment: string;
  date: string;
  approved: boolean;
  avatar?: string;
  media?: string[];
  purchaseDate?: string;
};

type StoreSnapshot = {
  products: Product[];
  reviews: Review[];
  settings: {
    announcement: string;
    heroTitle: string;
    catalogRelease?: string;
  };
};

const initialReviews: Review[] = [
  { id: 101, productId: 1, name: "Camila Freitas", rating: 5, comment: "Compacta, silenciosa e muito fácil de limpar. Virou item obrigatório na cozinha.", date: "2026-08-04", purchaseDate: "2026-07-27", approved: true },
  { id: 102, productId: 4, name: "Rafael Moura", rating: 5, comment: "O café fica moído na hora e o acabamento é excelente.", date: "2026-08-02", purchaseDate: "2026-07-24", approved: true },
  { id: 103, productId: 9, name: "Ana Luiza", rating: 5, comment: "Deixou a rotina de limpeza bem mais prática. Recomendo.", date: "2026-07-29", purchaseDate: "2026-07-19", approved: true },
];

const imageBase = "https://images.unsplash.com";
const catalogImage = (id: string) => `${imageBase}/${id}?auto=format&fit=crop&w=1200&q=84`;
const catalogGallery = (...ids: string[]) => ids.map(catalogImage);
const CATALOG_RELEASE = "izzat-real-catalog-2026-08";

export const initialProducts: Product[] = [
  { id: 1, name: "Air Fryer Digital Compacta 4L", category: "Cozinha", price: 289.9, oldPrice: 359.9, pix: 275.41, image: catalogImage("photo-1556911220-e15b29be8c8f"), gallery: catalogGallery("photo-1556911220-e15b29be8c8f", "photo-1556910103-1c02745aae4d", "photo-1610701596007-11502861dcfa"), badge: "FRETE GRÁTIS", sold: 328, stock: 46, featured: true, description: "Air fryer digital de 4 litros para preparar refeições mais práticas no dia a dia. Possui cesto antiaderente removível, controle de temperatura e timer para assados, petiscos e porções para toda a família." },
  { id: 2, name: "Jogo de Facas Chef 6 Peças Inox", category: "Cozinha", price: 119.9, oldPrice: 159.9, pix: 113.91, image: catalogImage("photo-1593618998160-e34014e67546"), gallery: catalogGallery("photo-1593618998160-e34014e67546", "photo-1556910103-1c02745aae4d", "photo-1556911220-e15b29be8c8f"), badge: "FRETE GRÁTIS", sold: 214, stock: 58, featured: true, description: "Conjunto com seis facas em aço inox e cabo anatômico para cortar carnes, legumes, pães e frutas com conforto. Uma solução completa para renovar a rotina da cozinha." },
  { id: 3, name: "Luminária de Mesa LED Touch", category: "Home page", price: 89.9, oldPrice: 129.9, pix: 85.41, image: catalogImage("photo-1507473885765-e6ed057f782c"), gallery: catalogGallery("photo-1507473885765-e6ed057f782c", "photo-1513506003901-1e6a229e2d15", "photo-1494438639946-1ebd1d20bf85"), badge: "FRETE GRÁTIS", sold: 167, stock: 33, description: "Luminária LED com controle touch, três intensidades de luz e haste ajustável. Ideal para estudos, leitura, trabalho ou para criar um clima mais acolhedor no quarto." },
  { id: 4, name: "Organizador Multiuso com 3 Gavetas", category: "Home page", price: 74.9, oldPrice: 99.9, pix: 71.16, image: catalogImage("photo-1494438639946-1ebd1d20bf85"), gallery: catalogGallery("photo-1494438639946-1ebd1d20bf85", "photo-1513506003901-1e6a229e2d15", "photo-1505693416388-ac5ce068fe85"), badge: "FRETE GRÁTIS", sold: 141, stock: 40, description: "Organizador compacto com três gavetas para acessórios, maquiagem, papéis ou itens do escritório. Ajuda a aproveitar melhor o espaço e deixa tudo ao alcance das mãos." },
  { id: 5, name: "Cafeteira Elétrica Programável 1,5L", category: "Eletroportáteis", price: 219.9, oldPrice: 279.9, pix: 208.91, image: catalogImage("photo-1495474472287-4d71bcdd2085"), gallery: catalogGallery("photo-1495474472287-4d71bcdd2085", "photo-1514432324607-a09d9b4aefdd", "photo-1447933601403-0c6688de566e"), badge: "FRETE GRÁTIS", sold: 271, stock: 31, featured: true, description: "Cafeteira elétrica com jarra de 1,5 litro, sistema corta-pingos e placa aquecedora. Perfeita para preparar várias xícaras de café fresco para a casa ou escritório." },
  { id: 6, name: "Liquidificador Turbo 1200W com Jarra 3L", category: "Eletroportáteis", price: 179.9, oldPrice: 229.9, pix: 170.91, image: catalogImage("photo-1570222094114-d054a817e56b"), gallery: catalogGallery("photo-1570222094114-d054a817e56b", "photo-1547592180-85f173990554", "photo-1556910103-1c02745aae4d"), badge: "FRETE GRÁTIS", sold: 189, stock: 27, description: "Liquidificador de alta potência com jarra resistente de 3 litros e múltiplas velocidades. Indicado para vitaminas, molhos, massas leves e receitas para toda a família." },
  { id: 7, name: "Escova Elétrica Giratória para Limpeza", category: "Utilitários Domésticos", price: 129.9, oldPrice: 169.9, pix: 123.41, image: catalogImage("photo-1584622650111-993a426fbf0a"), gallery: catalogGallery("photo-1584622650111-993a426fbf0a", "photo-1527515637462-cff94eecc1ac", "photo-1581578731548-c64695cc6952"), badge: "FRETE GRÁTIS", sold: 416, stock: 69, featured: true, description: "Escova elétrica giratória com cabeças intercambiáveis para facilitar a limpeza de azulejos, box, pia e superfícies do dia a dia. Leve, prática e confortável de manusear." },
  { id: 8, name: "Varal Retrátil de Parede em Aço", category: "Utilitários Domésticos", price: 99.9, oldPrice: 139.9, pix: 94.91, image: catalogImage("photo-1583947215259-38e31be8751f"), gallery: catalogGallery("photo-1583947215259-38e31be8751f", "photo-1610557892470-b8a7f5390b15", "photo-1581578731548-c64695cc6952"), badge: "FRETE GRÁTIS", sold: 122, stock: 36, description: "Varal retrátil para parede com estrutura resistente e recolhimento prático. Uma alternativa discreta para secar roupas em apartamentos, lavanderias e áreas compactas." },
  { id: 9, name: "Fone Bluetooth Sem Fio com Estojo", category: "Eletrônicos", price: 149.9, oldPrice: 199.9, pix: 142.41, image: catalogImage("photo-1505740420928-5e560c06d30e"), gallery: catalogGallery("photo-1505740420928-5e560c06d30e", "photo-1606220945770-b5b6c2c55bf1", "photo-1546435770-a3e426bf472b"), badge: "FRETE GRÁTIS", sold: 389, stock: 82, featured: true, description: "Fone sem fio com conexão Bluetooth, estojo de recarga e encaixe confortável. Ideal para músicas, chamadas, treinos e uso diário com liberdade de movimento." },
  { id: 10, name: "Smartwatch Esportivo Tela Touch", category: "Eletrônicos", price: 189.9, oldPrice: 249.9, pix: 180.41, image: catalogImage("photo-1523275335684-37898b6baf30"), gallery: catalogGallery("photo-1523275335684-37898b6baf30", "photo-1434493789847-2f02dc6ca35d", "photo-1508685096489-7aacd43bd3b1"), badge: "FRETE GRÁTIS", sold: 254, stock: 54, description: "Relógio inteligente com tela touch, notificações, monitoramento de atividades e pulseira confortável. Um companheiro prático para acompanhar sua rotina e seus treinos." },
  { id: 11, name: "Suporte Dobrável para Notebook em Alumínio", category: "Gadgets", price: 79.9, oldPrice: 109.9, pix: 75.91, image: catalogImage("photo-1516321318423-f06f85e504b3"), gallery: catalogGallery("photo-1516321318423-f06f85e504b3", "photo-1496181133206-80ce9b88a853", "photo-1505238680356-667803448bb6"), badge: "FRETE GRÁTIS", sold: 203, stock: 47, description: "Suporte dobrável em alumínio com ajuste de altura para melhorar a ergonomia no trabalho ou estudo. Leve para transportar e compatível com notebooks de diversos tamanhos." },
  { id: 12, name: "Mini Projetor Portátil Full HD", category: "Gadgets", price: 399.9, oldPrice: 529.9, pix: 379.91, image: catalogImage("photo-1528395874238-c2a9c3500b6a"), gallery: catalogGallery("photo-1528395874238-c2a9c3500b6a", "photo-1489599849927-2ee91cede3ba", "photo-1485846234645-a62644f84728"), badge: "FRETE GRÁTIS", sold: 98, stock: 18, description: "Mini projetor portátil para filmes, séries, jogos e apresentações. Conta com conexões versáteis e formato compacto para levar a experiência de tela grande para onde quiser." },
  { id: 13, name: "Parafusadeira Furadeira Sem Fio 21V", category: "Ferramentas", price: 249.9, oldPrice: 319.9, pix: 237.41, image: catalogImage("photo-1504148455328-c376907d081c"), gallery: catalogGallery("photo-1504148455328-c376907d081c", "photo-1586864387967-d02ef85d93e8", "photo-1530124566582-a618bc2615dc"), badge: "FRETE GRÁTIS", sold: 176, stock: 29, featured: true, description: "Parafusadeira e furadeira sem fio com bateria recarregável, ajuste de torque e kit de pontas. Uma ferramenta versátil para pequenos reparos, montagens e projetos domésticos." },
  { id: 14, name: "Jogo de Ferramentas 46 Peças", category: "Ferramentas", price: 159.9, oldPrice: 209.9, pix: 151.91, image: catalogImage("photo-1586864387967-d02ef85d93e8"), gallery: catalogGallery("photo-1586864387967-d02ef85d93e8", "photo-1530124566582-a618bc2615dc", "photo-1504148455328-c376907d081c"), badge: "FRETE GRÁTIS", sold: 146, stock: 35, description: "Maleta com 46 peças essenciais para manutenção da casa, incluindo soquetes, pontas, chave catraca e acessórios. Organização prática para ter a ferramenta certa sempre por perto." },
];

const categories = [
  { name: "Cozinha", icon: "https://woozenvision.myshopify.com/cdn/shop/files/1-slide-1707954557294-365542168-b9f16563a7ad8807dbdd9ef0ab34a85a1707954565-480-0_450x.png?v=1744634110" },
  { name: "Home page", icon: "https://woozenvision.myshopify.com/cdn/shop/files/1-slide-1707954557294-3177703078-2345b1123412e4d1648b87ddac7cec351707954564-480-0_450x.png?v=1744641051" },
  { name: "Eletroportáteis", icon: "https://woozenvision.myshopify.com/cdn/shop/files/1-slide-1707954557294-3200605279-18382ff2eddf3b99861b1222df17beab1707954567-480-0_450x.png?v=1744641069" },
  { name: "Utilitários Domésticos", icon: "https://woozenvision.myshopify.com/cdn/shop/files/1-slide-1707954557294-3585368905-6188d6748e7bbb886dd7e3615e3b2a6a1707954566-480-0_450x.png?v=1744641084" },
  { name: "Eletrônicos", icon: "https://woozenvision.myshopify.com/cdn/shop/files/1-slide-1707954557294-3671186922-aee0889f6c39e988ee6d58be237e6de61707954565-480-0_450x.png?v=1744641102" },
  { name: "Gadgets", icon: "https://woozenvision.myshopify.com/cdn/shop/files/1-slide-1707954557294-4582096771-d9b92f7d8390da95aef8a95148d7eef51707954568-480-0_450x.png?v=1744641117" },
  { name: "Ferramentas", icon: "https://woozenvision.myshopify.com/cdn/shop/files/1-slide-1707954557294-6702762443-00589e695895561a8bd9eeb7069e6e9b1707954569-480-0_450x.png?v=1744641136" },
];

export const formatPrice = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const imageForSize = (source: string, width: number) => {
  try {
    const url = new URL(source);
    if (url.hostname === "images.unsplash.com") {
      url.searchParams.set("w", String(width));
      url.searchParams.set("q", width <= 480 ? "72" : "80");
    } else if (url.hostname.endsWith("myshopify.com") || url.hostname.endsWith("cdn.shopify.com")) {
      url.searchParams.set("width", String(width));
    } else {
      return source;
    }
    return url.toString();
  } catch {
    return source;
  }
};

const imageSrcSet = (source: string, widths: number[]) => {
  const candidates = widths.map((width) => imageForSize(source, width));
  return new Set(candidates).size > 1
    ? candidates.map((candidate, index) => `${candidate} ${widths[index]}w`).join(", ")
    : undefined;
};

const onlyDigits = (value: string) => value.replace(/\D/g, "");
const formatCep = (value: string) => onlyDigits(value).slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2");
const formatCpf = (value: string) => onlyDigits(value).slice(0, 11).replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
const formatPhone = (value: string) => {
  let digits = onlyDigits(value).slice(0, 13);
  if (digits.length > 11 && digits.startsWith("55")) digits = digits.slice(2);
  digits = digits.slice(0, 11);
  if (digits.length <= 10) return digits.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  return digits.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
};
export const checkoutText = (product: Product) => ({
  title: product.checkoutTitle?.trim() || product.name,
  badge: !product.checkoutBadge?.trim() || /woozen/i.test(product.checkoutBadge) ? "OFERTA IZZAT" : product.checkoutBadge.trim(),
  guarantee: product.checkoutGuarantee?.trim() || "Se não gostar, você pode solicitar a devolução em até 7 dias após o recebimento.",
  delivery: product.checkoutDelivery?.trim() || "Frete grátis · entrega estimada de 3 a 6 dias úteis",
  pixCode: product.pixCode?.trim() || "",
});

const AdminPanel = lazy(() => import("./admin-panel"));

function Logo() {
  return (
    <button className="logo" onClick={() => window.dispatchEvent(new CustomEvent("go-home"))} aria-label="Ir para a página inicial">
      <img className="brand-logo" src="/izzat-logo.png" width={512} height={512} alt="Izzat Express" decoding="async" />
    </button>
  );
}

function ProductCard({ product, onOpen, onAdd }: { product: Product; onOpen: (product: Product) => void; onAdd: (product: Product) => void }) {
  const discount = Math.round((1 - product.price / product.oldPrice) * 100);
  return (
    <article className="product-card">
      <button className="product-image-wrap" onClick={() => onOpen(product)} aria-label={`Ver ${product.name}`}>
        {product.badge && <span className="product-badge">{product.badge}</span>}
        <img
          src={imageForSize(product.image, 360)}
          srcSet={imageSrcSet(product.image, [240, 360, 480])}
          sizes="(max-width: 520px) 50vw, (max-width: 980px) 33vw, 180px"
          width={360}
          height={360}
          alt={product.name}
          loading="lazy"
          decoding="async"
          fetchPriority="low"
        />
        <span className="quick-view">Ver produto</span>
      </button>
      <div className="product-info">
        <div className="product-category">{product.category}</div>
        <button className="product-name" onClick={() => onOpen(product)}>{product.name}</button>
        <div className="rating">★★★★★ <span>({product.sold})</span></div>
        <div className="old-price">{formatPrice(product.oldPrice)}</div>
        <div className="price-row"><strong>{formatPrice(product.price)}</strong><em>{discount}% OFF</em></div>
        <div className="pix-line">ou <b>{formatPrice(product.pix)}</b> no Pix</div>
        <button className="add-button" onClick={() => onAdd(product)}>Adicionar ao Carrinho</button>
      </div>
    </article>
  );
}

function Header({ cartCount, searchTerm, setSearchTerm, onSearch, onHome, onOpenAccount, announcement = "Frete grátis para todo o Brasil" }: { cartCount: number; searchTerm: string; setSearchTerm: (value: string) => void; onSearch: () => void; onHome: () => void; onOpenAccount: () => void; announcement?: string }) {
  const isShippingMessage = /frete\s+gr[aá]tis/i.test(announcement);
  const [localizedAnnouncement, setLocalizedAnnouncement] = useState(isShippingMessage ? "Frete grátis para todo o Brasil" : announcement);

  useEffect(() => {
    if (!isShippingMessage) {
      setLocalizedAnnouncement(announcement);
      return;
    }

    const cacheKey = "izzat-shipping-location-v1";
    setLocalizedAnnouncement("Frete grátis para todo o Brasil");
    try {
      const cached = window.localStorage.getItem(cacheKey);
      if (cached) {
        const location = JSON.parse(cached) as { city?: string; state?: string; expiresAt?: number };
        if (location.city && Number(location.expiresAt) > Date.now()) {
          const place = location.state ? `${location.city}, ${location.state}` : location.city;
          setLocalizedAnnouncement(`Frete grátis para ${place} e Região`);
          return;
        }
      }
    } catch { /* localização é apenas um aprimoramento visual */ }

    const controller = new AbortController();
    const loadLocation = () => {
      void fetch("/api/location", { signal: controller.signal })
        .then((response) => response.ok ? response.json() : null)
        .then((location: { city?: string; state?: string } | null) => {
          if (!location?.city) return;
          const place = location.state ? `${location.city}, ${location.state}` : location.city;
          setLocalizedAnnouncement(`Frete grátis para ${place} e Região`);
          try {
            window.localStorage.setItem(cacheKey, JSON.stringify({ ...location, expiresAt: Date.now() + 86_400_000 }));
          } catch { /* segue sem cache se o aparelho bloquear o armazenamento */ }
        })
        .catch(() => undefined);
    };
    let idleId: number | undefined;
    let fallbackTimer: ReturnType<typeof setTimeout> | undefined;
    const idleWindow = window as Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (handle: number) => void;
    };
    if (typeof idleWindow.requestIdleCallback === "function") {
      idleId = idleWindow.requestIdleCallback(loadLocation, { timeout: 1600 });
    } else {
      fallbackTimer = globalThis.setTimeout(loadLocation, 600);
    }

    return () => {
      controller.abort();
      if (idleId !== undefined) idleWindow.cancelIdleCallback?.(idleId);
      if (fallbackTimer !== undefined) globalThis.clearTimeout(fallbackTimer);
    };
  }, [announcement, isShippingMessage]);

  return (
    <header>
      <div className="announcement" aria-live="polite"><i className="bi bi-geo-alt-fill" aria-hidden="true" /><span>{localizedAnnouncement}</span></div>
      <div className="main-header">
        <div className="header-inner">
          <button className="mobile-menu-trigger" aria-label="Abrir menu"><span /></button>
          <Logo />
          <div className="mobile-header-actions" aria-label="Ações da conta">
            <button className="mobile-user-trigger" aria-label="Minha conta" onClick={onOpenAccount} />
            <button className="mobile-pin-trigger" aria-label="Rastrear pedido" />
            <button className="mobile-bag-trigger" aria-label="Abrir sacola" onClick={() => window.dispatchEvent(new CustomEvent("open-cart"))} />
            <strong>{cartCount}</strong>
          </div>
          <form className="search-box" onSubmit={(event) => { event.preventDefault(); onSearch(); }}>
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Pesquisar..." aria-label="Pesquisar produtos" />
            <button type="submit" aria-label="Buscar"><i className="bi bi-search" /></button>
          </form>
          <div className="header-links">
            <button className="header-account" onClick={onOpenAccount}><small>Entrar / Criar conta</small><b>Minha conta <i className="bi bi-chevron-down" /></b></button>
            <button className="tracking"><span><i className="bi bi-geo-alt-fill" /></span><small>Onde está meu produto?</small><b>Rastrear Pedido</b></button>
            <button className="cart-trigger" onClick={() => window.dispatchEvent(new CustomEvent("open-cart"))}>Sacola <span><i className="bi bi-bag-dash-fill" /></span><strong>{cartCount}</strong></button>
          </div>
        </div>
      </div>
      <nav className="desktop-nav">
        <div className="nav-inner">
          <button onClick={onHome}>Início</button>
          {categories.map((category) => <button key={category.name} onClick={() => window.dispatchEvent(new CustomEvent("category", { detail: category.name }))}>{category.name}</button>)}
        </div>
      </nav>
    </header>
  );
}

function AccountAccess({ onClose }: { onClose: () => void }) {
  const [notice, setNotice] = useState("");
  return <div className="account-access-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="account-access-modal" role="dialog" aria-modal="true" aria-labelledby="account-access-title"><button className="account-access-close" type="button" onClick={onClose} aria-label="Fechar">×</button><div className="account-access-icon"><i className="bi bi-person-lock" /></div><span className="detail-kicker">ÁREA DO CLIENTE</span><h2 id="account-access-title">Minha conta</h2><p>Em breve você poderá acompanhar pedidos e guardar seus dados para uma compra ainda mais rápida.</p><form onSubmit={(event) => { event.preventDefault(); setNotice("O acesso de clientes será liberado em breve. Enquanto isso, suas compras continuam funcionando normalmente."); }}><label>E-mail<input type="email" placeholder="voce@email.com" autoComplete="email" required /></label><label>Senha<input type="password" placeholder="Sua senha" autoComplete="current-password" required /></label>{notice && <p className="account-access-notice"><i className="bi bi-info-circle" />{notice}</p>}<button className="primary-button" type="submit">Entrar em minha conta <i className="bi bi-arrow-right" /></button></form><div className="account-access-footer"><button type="button" onClick={() => setNotice("O cadastro de novas contas está temporariamente indisponível.")}>Criar conta <small>em breve</small></button><span /> <button type="button" onClick={() => setNotice("Quando a área do cliente for liberada, você poderá recuperar sua senha por e-mail.")}>Esqueci minha senha</button></div><small className="account-access-safe"><i className="bi bi-shield-check" /> Seus dados ficam protegidos.</small></section></div>;
}

function Benefits() {
  const items = [
    ["bi-truck", "Frete Grátis", "Entrega em todo Brasil"],
    ["bi-credit-card", "Parcelamento", "Em até 3x sem juros"],
    ["bi-qr-code", "Pagamento à vista", "10% de desconto no PIX"],
    ["bi-shield-lock", "Segurança", "Loja com SSL de proteção"],
  ];
  return <div className="benefits">{items.map(([icon, title, text]) => <div className="benefit" key={title}><span><i className={`bi ${icon}`} /></span><div><b>{title}</b><small>{text}</small></div></div>)}</div>;
}

function HomePage({ products, onOpen, onAdd, heroTitle, heroSubtitle }: { products: Product[]; onOpen: (product: Product) => void; onAdd: (product: Product) => void; heroTitle: string; heroSubtitle: string }) {
  return (
    <main>
      <section className="hero-banner">
        <div className="hero-grid-lines" />
        <div className="hero-copy"><span>OFERTAS RELÂMPAGO</span><h1>{heroTitle}</h1><p>{heroSubtitle}</p><button onClick={() => document.getElementById("products")?.scrollIntoView({ behavior: "smooth" })}>Clique e saiba mais</button></div>
        <div className="hero-watch">◒<strong>smart<br />watches</strong><b>até<br /><i>40%</i></b><small>de desconto</small></div>
      </section>
      <div className="container"><Benefits />
        <section className="category-strip"><div className="section-heading"><h2>Compre por categoria</h2><button onClick={() => window.dispatchEvent(new CustomEvent("category", { detail: "Todos" }))}>Ver todos</button></div><div className="category-list">{categories.map((category) => <button key={category.name} onClick={() => window.dispatchEvent(new CustomEvent("category", { detail: category.name }))}><span><img src={imageForSize(category.icon, 160)} width={160} height={160} alt="" loading="lazy" decoding="async" fetchPriority="low" /></span><small>{category.name}</small></button>)}</div></section>
        <section className="products-section" id="products"><div className="section-heading"><div><h2>Panelas e Talheres Tramontina. Qualidade e Confiança para sua Cozinha!</h2><p>Os favoritos da casa com preço especial por tempo limitado.</p></div><button onClick={() => window.dispatchEvent(new CustomEvent("category", { detail: "Todos" }))}>Ver todos</button></div><div className="product-grid">{products.slice(0, 12).map((product) => <ProductCard key={product.id} product={product} onOpen={onOpen} onAdd={onAdd} />)}</div></section>
        <section className="utility-banner"><div className="utility-copy"><h3>Utilitários Domésticos</h3><p>Para mais produtos relacionados, clique no botão abaixo!</p><button onClick={() => window.dispatchEvent(new CustomEvent("category", { detail: "Utilitários Domésticos" }))}>Ver mais produtos</button></div><div className="utility-products">{products.slice(0, 4).map((product) => <ProductCard key={product.id} product={product} onOpen={onOpen} onAdd={onAdd} />)}</div></section>
        <section className="orange-promos"><div><h3>Apple Watch SE</h3><p>Para amar cada segundo.<br />Veja todos os benefícios!</p><button>Saiba mais</button></div><div><h3>Apple Watch SE</h3><p>Para amar cada segundo.<br />Veja todos os benefícios!</p><button>Saiba mais</button></div></section>
        <Testimonials />
      </div>
    </main>
  );
}

function Testimonials() {
  const testimonials = [["Isabela Silva", "Eu nunca imaginei que seria tão fácil comprar minha própria loja de dropshipping. Graças a dicas que encontrei..."], ["Pedro Santos", "Eu estava um pouco preocupado com a ideia de trabalhar com fornecedores estrangeiros, mas o processo de..."], ["Fernanda Oliveira", "Eu não tinha experiência em negócios online, mas queria começar uma loja de forma simples e segura."], ["Lucas Costa", "Acho que a melhor parte de ter uma loja de dropshipping é a flexibilidade que ela oferece. Posso gerenciar tudo de..."]];
  return <section className="testimonials"><div className="section-heading"><h2>O que os clientes falam sobre nós</h2></div><div className="testimonial-grid">{testimonials.map(([name, text]) => <article key={name}><b>{name}</b><small>15/08/2024</small><p>{text}</p><div className="rating">★★★★★</div></article>)}</div></section>;
}

function ProductPrice({ product }: { product: Product }) {
  const discount = Math.max(0, product.oldPrice - product.price);
  const discountPercent = Math.max(1, Math.round((discount / product.oldPrice) * 100));
  return <><section className="reference-price"><div className="reference-old-price">DE <del>{formatPrice(product.oldPrice)}</del></div><div className="reference-current-price">{formatPrice(product.price)} <span>↓ {discountPercent}%</span></div><p className="reference-installments">em até 3x de <b>{formatPrice(product.price / 3)}</b></p><div className="reference-saving">{formatPrice(discount)} de desconto</div><div className="reference-pix"><i className="pix-symbol" aria-hidden="true" /> Até 10% OFF <span>no PIX</span></div></section><button className="buy-now-inline" onClick={() => document.querySelector<HTMLButtonElement>(".product-page .buy-now")?.click()}>Comprar agora</button></>;
}

type CheckoutFormData = {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
};

const validateCheckoutField = (key: keyof CheckoutFormData, value: string) => {
  if (key === "name" && value.trim().length < 3) return "Digite seu nome completo.";
  if (key === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Informe um e-mail válido.";
  if (key === "phone" && onlyDigits(value).length < 10) return "Informe um celular válido.";
  if (key === "cpf" && value.trim() && onlyDigits(value).length !== 11) return "Confira o CPF ou deixe o campo em branco.";
  if (key === "cep" && onlyDigits(value).length !== 8) return "Informe um CEP válido.";
  if (key === "street" && value.trim().length < 3) return "Informe sua rua ou avenida.";
  if (key === "number" && !value.trim()) return "Informe o número.";
  if (key === "neighborhood" && value.trim().length < 2) return "Informe o bairro.";
  if (key === "city" && value.trim().length < 2) return "Informe a cidade.";
  if (key === "state" && value.trim().length !== 2) return "Use a sigla do estado.";
  return undefined;
};

function CheckoutFlow({ product, reviews, onClose }: { product: Product; reviews: Review[]; onClose: () => void }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const checkoutViewportHeightRef = useRef(0);
  const completePaymentTracked = useRef(false);
  const dataCompletionTracked = useRef(false);
  const deliveryCompletionTracked = useRef(false);
  const pixDisplayedTracked = useRef(false);
  const [stage, setStage] = useState<"form" | "processing" | "pix">("form");
  const [processingStep, setProcessingStep] = useState(0);
  const [copied, setCopied] = useState(false);
  const [showCpf, setShowCpf] = useState(false);
  const [showFullAddress, setShowFullAddress] = useState(true);
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [cepStatus, setCepStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [cepMessage, setCepMessage] = useState("");
  const [orderSaving, setOrderSaving] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [fields, setFields] = useState<CheckoutFormData>({ name: "", email: "", phone: "", cpf: "", cep: "", street: "", number: "", complement: "", neighborhood: "", city: "", state: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof CheckoutFormData, string>>>({});
  const settings = checkoutText(product);
  const orderId = useMemo(() => `IZ-${String(product.id).padStart(3, "0")}-${String(Date.now()).slice(-6)}`, [product.id]);
  const checkoutFormId = `woozen-checkout-${product.id}`;
  const mobileSummaryId = `checkout-mobile-summary-${product.id}`;
  const pixDiscount = Math.max(0, product.price - product.pix);
  const customerFirstName = fields.name.trim().split(/\s+/)[0] || "cliente";
  const approvedReviews = reviews.filter((review) => review.productId === product.id && review.approved);
  const reviewAverage = approvedReviews.length ? approvedReviews.reduce((sum, review) => sum + review.rating, 0) / approvedReviews.length : 0;
  const dataComplete = !validateCheckoutField("name", fields.name) && !validateCheckoutField("email", fields.email) && !validateCheckoutField("phone", fields.phone);
  const deliveryComplete = !validateCheckoutField("cep", fields.cep) && !validateCheckoutField("street", fields.street) && !validateCheckoutField("number", fields.number) && !validateCheckoutField("neighborhood", fields.neighborhood) && !validateCheckoutField("city", fields.city) && !validateCheckoutField("state", fields.state);
  const formComplete = dataComplete && deliveryComplete && (!fields.cpf.trim() || !validateCheckoutField("cpf", fields.cpf));
  const ctaLabel = <>Continuar para o Pix <span>· {formatPrice(product.pix)}</span><i className="bi bi-arrow-right" /></>;
  const deliveryPlace = fields.city && fields.state ? `${fields.city}/${fields.state}` : "seu endereço";

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", closeOnEscape); };
  }, [onClose]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const viewport = window.visualViewport;
    let keyboardTimer: number | undefined;
    checkoutViewportHeightRef.current = Math.max(window.innerHeight, viewport?.height ?? 0);
    const updateKeyboardState = () => {
      const currentHeight = viewport?.height ?? window.innerHeight;
      checkoutViewportHeightRef.current = Math.max(checkoutViewportHeightRef.current, currentHeight);
      const activeElement = document.activeElement;
      const inputFocused = activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement || activeElement instanceof HTMLSelectElement;
      const viewportReduced = checkoutViewportHeightRef.current - currentHeight > 120;
      const viewportCovered = viewport ? window.innerHeight - viewport.height - viewport.offsetTop > 120 : false;
      setKeyboardOpen(inputFocused && (viewportReduced || viewportCovered));
    };
    const scheduleKeyboardUpdate = () => {
      if (keyboardTimer !== undefined) window.clearTimeout(keyboardTimer);
      keyboardTimer = window.setTimeout(updateKeyboardState, 40);
    };
    viewport?.addEventListener("resize", scheduleKeyboardUpdate);
    viewport?.addEventListener("scroll", scheduleKeyboardUpdate);
    window.addEventListener("resize", scheduleKeyboardUpdate);
    document.addEventListener("focusin", scheduleKeyboardUpdate);
    document.addEventListener("focusout", scheduleKeyboardUpdate);
    updateKeyboardState();
    return () => {
      if (keyboardTimer !== undefined) window.clearTimeout(keyboardTimer);
      viewport?.removeEventListener("resize", scheduleKeyboardUpdate);
      viewport?.removeEventListener("scroll", scheduleKeyboardUpdate);
      window.removeEventListener("resize", scheduleKeyboardUpdate);
      document.removeEventListener("focusin", scheduleKeyboardUpdate);
      document.removeEventListener("focusout", scheduleKeyboardUpdate);
    };
  }, []);

  useEffect(() => {
    if (!dataComplete || dataCompletionTracked.current) return;
    dataCompletionTracked.current = true;
    trackCheckoutUxEvent(product, "CheckoutDataCompleted", { orderId });
  }, [dataComplete, orderId, product]);

  useEffect(() => {
    if (!deliveryComplete || deliveryCompletionTracked.current) return;
    deliveryCompletionTracked.current = true;
    trackCheckoutUxEvent(product, "CheckoutDeliveryCompleted", { orderId });
  }, [deliveryComplete, orderId, product]);

  useEffect(() => {
    if (stage !== "processing") return;
    setProcessingStep(0);
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    const secondStep = window.setTimeout(() => setProcessingStep(1), 360);
    const thirdStep = window.setTimeout(() => setProcessingStep(2), 760);
    const finish = window.setTimeout(() => {
      setStage("pix");
      contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }, 1250);
    return () => {
      window.clearTimeout(secondStep);
      window.clearTimeout(thirdStep);
      window.clearTimeout(finish);
    };
  }, [stage]);

  useEffect(() => {
    if (stage !== "pix" || !settings.pixCode || completePaymentTracked.current) return;
    completePaymentTracked.current = true;
    trackProductEvent(product, "CompletePayment", {
      orderId,
      customer: { email: fields.email, phone: fields.phone },
    });
  }, [stage, settings.pixCode, product, orderId, fields.email, fields.phone]);

  useEffect(() => {
    if (stage !== "pix" || pixDisplayedTracked.current) return;
    pixDisplayedTracked.current = true;
    trackCheckoutUxEvent(product, "PixDisplayed", { orderId });
  }, [stage, orderId, product]);

  useEffect(() => {
    const cep = onlyDigits(fields.cep);
    if (cep.length !== 8) {
      setCepStatus("idle");
      setCepMessage("");
      return;
    }

    const controller = new AbortController();
    setCepStatus("loading");
    setCepMessage("Buscando seu endereço...");
    void fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Falha na consulta do CEP");
        return response.json() as Promise<{ erro?: boolean; logradouro?: string; bairro?: string; localidade?: string; uf?: string }>;
      })
      .then((address) => {
        if (address.erro) throw new Error("CEP não encontrado");
        setFields((current) => ({
          ...current,
          street: address.logradouro || current.street,
          neighborhood: address.bairro || current.neighborhood,
          city: address.localidade || current.city,
          state: address.uf || current.state,
        }));
        setErrors((current) => ({ ...current, cep: undefined, street: undefined, neighborhood: undefined, city: undefined, state: undefined }));
        setCepStatus("success");
        setShowFullAddress(!(address.logradouro && address.bairro && address.localidade && address.uf));
        setCepMessage(`Endereço encontrado${address.localidade && address.uf ? ` em ${address.localidade}/${address.uf}` : ""}. Agora informe o número.`);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setCepStatus("error");
        setShowFullAddress(true);
        setCepMessage("Não encontramos esse CEP. Você pode preencher o endereço manualmente.");
      });

    return () => controller.abort();
  }, [fields.cep]);

  useEffect(() => {
    if (onlyDigits(fields.cep).length !== 8) setShowFullAddress(true);
  }, [fields.cep]);

  const setField = (key: keyof CheckoutFormData, value: string) => {
    setFields((current) => ({ ...current, [key]: value }));
    if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const validateField = validateCheckoutField;

  const validateOnBlur = (key: keyof CheckoutFormData) => {
    const message = validateField(key, fields[key]);
    setErrors((current) => ({ ...current, [key]: message }));
  };

  const submitCheckout = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: Partial<Record<keyof CheckoutFormData, string>> = {};
    const requiredFields: Array<keyof CheckoutFormData> = ["name", "email", "phone", "cep", "street", "number", "neighborhood", "city", "state"];
    requiredFields.forEach((key) => {
      const message = validateField(key, fields[key]);
      if (message) nextErrors[key] = message;
    });
    if (fields.cpf.trim()) {
      const cpfError = validateField("cpf", fields.cpf);
      if (cpfError) nextErrors.cpf = cpfError;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      const firstInvalidField = Object.keys(nextErrors)[0];
      trackCheckoutUxEvent(product, "CheckoutValidationError", { orderId, context: { field: firstInvalidField, errorCount: Object.keys(nextErrors).length } });
      window.setTimeout(() => contentRef.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus(), 0);
      return;
    }
    trackCheckoutUxEvent(product, "CheckoutCtaClick", { orderId });
    setOrderSaving(true);
    setOrderError("");
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: orderId,
          customer: fields,
          product: { id: product.id, name: product.name, image: product.image, quantity: 1, price: product.price, pix: product.pix },
        }),
      });
      if (!response.ok) throw new Error("ORDER_SAVE_FAILED");
      trackProductEvent(product, "AddPaymentInfo", { orderId, customer: { email: fields.email, phone: fields.phone } });
      setStage("processing");
    } catch {
      setOrderError("Não foi possível registrar seu pedido agora. Confira sua conexão e tente novamente.");
      contentRef.current?.scrollTo({ top: contentRef.current.scrollHeight, behavior: "smooth" });
    } finally {
      setOrderSaving(false);
    }
  };

  const copyPix = async () => {
    if (!settings.pixCode) return;
    try {
      await navigator.clipboard.writeText(settings.pixCode);
    } catch {
      const helper = document.createElement("textarea");
      helper.value = settings.pixCode;
      helper.style.position = "fixed";
      helper.style.opacity = "0";
      document.body.appendChild(helper);
      helper.select();
      document.execCommand("copy");
      helper.remove();
    }
    setCopied(true);
    trackCheckoutUxEvent(product, "PixCopied", { orderId });
    window.setTimeout(() => setCopied(false), 2200);
  };

  const field = (key: keyof CheckoutFormData, label: string, placeholder: string, icon: string, options?: { type?: string; inputMode?: "text" | "email" | "tel" | "numeric"; autoComplete?: string; optional?: boolean; maxLength?: number; transform?: (value: string) => string; wide?: boolean }) => <label htmlFor={`checkout-${key}`} className={`checkout-field ${options?.wide ? "wide" : ""} ${errors[key] ? "has-error" : ""} ${fields[key] && !validateCheckoutField(key, fields[key]) ? "is-valid" : ""}`}>
    <span>{label}{options?.optional && <em>Opcional</em>}</span>
    <div className={key === "phone" ? "checkout-phone-input" : undefined}><i className={`bi ${icon}`} />{key === "phone" && <span className="checkout-country-code" aria-hidden="true">+55</span>}<input id={`checkout-${key}`} name={key} value={fields[key]} onChange={(event) => setField(key, options?.transform ? options.transform(event.target.value) : event.target.value)} onBlur={() => validateOnBlur(key)} placeholder={placeholder} type={options?.type ?? "text"} inputMode={options?.inputMode} autoComplete={options?.autoComplete} maxLength={options?.maxLength} required={!options?.optional} aria-invalid={Boolean(errors[key])} aria-describedby={errors[key] ? `checkout-${key}-error` : undefined} /></div>
    {errors[key] && <small id={`checkout-${key}-error`}>{errors[key]}</small>}
  </label>;

  return <div className="checkout-spa-overlay" role="dialog" aria-modal="true" aria-label="Checkout Izzat Express">
    <div className="checkout-spa" ref={contentRef}>
      <header className="checkout-spa-header"><button type="button" onClick={onClose} aria-label="Voltar para o produto"><i className="bi bi-chevron-left" /></button><div className="checkout-brand"><img className="brand-logo brand-logo-dark" src="/izzat-logo.png" alt="Izzat Express" /></div><span><i className="bi bi-lock-fill" /> Checkout seguro</span></header>
      {stage === "form" ? <div className="checkout-spa-body">
        <section className="checkout-intro"><div><span>CHECKOUT EXPRESSO</span><h1>Finalize seu pedido</h1><p>Compra como visitante, sem cadastro.</p></div><div className="checkout-progress" aria-label="Etapas do checkout"><span className={dataComplete ? "complete" : "active"}><b>{dataComplete ? <i className="bi bi-check-lg" /> : 1}</b> Dados</span><span className={deliveryComplete ? "complete" : dataComplete ? "active" : ""}><b>{deliveryComplete ? <i className="bi bi-check-lg" /> : 2}</b> Entrega</span><span className={formComplete ? "active" : ""}><b>3</b> Gerar Pix</span></div></section>
        <aside className={`checkout-summary-column ${mobileSummaryOpen ? "mobile-summary-open" : ""}`} aria-label="Resumo do pedido">
          <button className="checkout-mobile-summary-toggle" type="button" aria-expanded={mobileSummaryOpen} aria-controls={mobileSummaryId} onClick={() => setMobileSummaryOpen((current) => !current)}>
            <img src={imageForSize(product.image, 160)} width={160} height={160} alt="" decoding="async" />
            <span className="checkout-mobile-summary-product"><small>Seu pedido</small><b>{settings.title}</b><em><i className="bi bi-truck" /> Frete grátis</em></span>
            <span className="checkout-mobile-summary-total"><strong>{formatPrice(product.pix)}</strong><small>{mobileSummaryOpen ? "Ocultar" : "Ver resumo"} <i className={`bi bi-chevron-${mobileSummaryOpen ? "up" : "down"}`} /></small></span>
          </button>
          <section className="checkout-product-card"><span className="checkout-offer-badge">{settings.badge}</span><img src={imageForSize(product.image, 240)} width={240} height={240} alt={product.name} decoding="async" /><div><h2>{settings.title}</h2><del>{formatPrice(product.oldPrice)}</del><strong>{formatPrice(product.pix)} no Pix</strong>{approvedReviews.length > 0 && <div className="checkout-review-proof"><span>★★★★★</span><b>{reviewAverage.toFixed(1)}</b><small>{approvedReviews.length} {approvedReviews.length === 1 ? "avaliação verificada" : "avaliações verificadas"}</small></div>}<p><i className="bi bi-shield-check" /> Compra segura <i className="bi bi-truck" /> Frete grátis</p></div></section>
          <section className="checkout-order-summary" id={mobileSummaryId}><h2>Resumo do pedido</h2><div><span>Produto</span><b>{formatPrice(product.price)}</b></div>{pixDiscount > 0 && <div className="discount"><span>Desconto no Pix</span><b>− {formatPrice(pixDiscount)}</b></div>}<div><span>Frete</span><b className="free">Grátis</b></div><div className="total"><span>Total no Pix</span><strong>{formatPrice(product.pix)}</strong></div><small>Você não terá cobranças adicionais.</small></section>
          <section className="checkout-guarantee"><i className="bi bi-arrow-counterclockwise" /><div><b>7 dias para decidir</b><p>{settings.guarantee}</p></div></section>
          <button className={`checkout-summary-submit ${formComplete ? "ready" : ""}`} type="submit" form={checkoutFormId} disabled={orderSaving}>{orderSaving ? <>Registrando pedido <i className="bi bi-arrow-repeat" /></> : ctaLabel}</button>
          <div className="checkout-security"><span><i className="bi bi-lock-fill" /> Conexão segura</span><span><i className="bi bi-shield-check" /> Dados usados neste pedido</span><span><i className="bi bi-bank" /> Pix confirmado no seu banco</span><small>Precisa de ajuda? suporte@izzat.com.br</small></div>
        </aside>
        <form id={checkoutFormId} className="checkout-single-form" onSubmit={submitCheckout} noValidate>
          <section className="checkout-form-card"><h2><span>1</span> Dados pessoais</h2><div className="checkout-form-fields">
            {field("name", "Nome completo", "Digite seu nome completo", "bi-person", { autoComplete: "name" })}
            {field("email", "E-mail", "exemplo@email.com", "bi-envelope", { type: "email", inputMode: "email", autoComplete: "email" })}
            <div className="checkout-phone-field">{field("phone", "Celular / WhatsApp", "(00) 00000-0000", "bi-telephone", { type: "tel", inputMode: "tel", autoComplete: "tel", transform: formatPhone })}<small>Usado somente para atualizações e dúvidas sobre a entrega. Não enviamos promoções sem autorização.</small></div>
            {showCpf ? field("cpf", "CPF", "000.000.000-00", "bi-person-vcard", { inputMode: "numeric", autoComplete: "off", optional: true, transform: formatCpf }) : <button className="checkout-optional-toggle" type="button" onClick={() => setShowCpf(true)}><i className="bi bi-plus-circle" /><span><b>Adicionar CPF</b><small>Opcional para este pedido</small></span><i className="bi bi-chevron-right" /></button>}
            <p className="checkout-data-note"><i className="bi bi-lock" /> Seus dados serão usados apenas para confirmar e entregar este pedido.</p>
          </div></section>
          <section className="checkout-form-card"><h2><span>2</span> Entrega</h2><div className="checkout-form-fields checkout-address-grid">
            <div className="checkout-cep-block">{field("cep", "CEP", "00000-000", "bi-geo-alt", { inputMode: "numeric", autoComplete: "postal-code", transform: formatCep })}{cepStatus !== "idle" && <div className={`checkout-cep-status ${cepStatus}`} role="status" aria-live="polite"><i className={`bi ${cepStatus === "loading" ? "bi-arrow-repeat" : cepStatus === "success" ? "bi-check-circle-fill" : "bi-info-circle"}`} /> <span>{cepMessage}</span>{cepStatus === "success" && <button type="button" onClick={() => setShowFullAddress((current) => !current)}>{showFullAddress ? "Ocultar detalhes" : "Editar endereço"}</button>}</div>}</div>
            <div className={`checkout-address-auto ${cepStatus === "success" && !showFullAddress ? "collapsed" : ""}`}>{field("street", "Endereço", "Rua ou avenida", "bi-signpost", { autoComplete: "address-line1", wide: true })}</div>
            {field("number", "Número", "123", "bi-house", { inputMode: "numeric", autoComplete: "address-line2" })}
            {field("complement", "Complemento", "Apto, bloco...", "bi-building", { autoComplete: "address-line2", optional: true })}
            <div className={`checkout-address-auto ${cepStatus === "success" && !showFullAddress ? "collapsed" : ""}`}>{field("neighborhood", "Bairro", "Seu bairro", "bi-map", { autoComplete: "address-level3", wide: true })}{field("city", "Cidade", "Sua cidade", "bi-buildings", { autoComplete: "address-level2" })}{field("state", "Estado", "SP", "bi-pin-map", { autoComplete: "address-level1", maxLength: 2, transform: (value) => value.replace(/[^a-z]/gi, "").toUpperCase() })}</div>
          </div><div className="checkout-delivery-note"><i className="bi bi-truck" /><div><small>Frete grátis para {deliveryPlace}</small><b>{settings.delivery}</b></div></div></section>
          <section className="checkout-form-card checkout-payment-card"><h2><span>3</span> Pagamento</h2><div className="checkout-pix-option"><span className="checkout-pix-mark"><i className="pix-symbol" aria-hidden="true" /></span><div><small>Pagamento à vista</small><b>Pix</b><p>Rápido, seguro e sem taxas adicionais</p></div><strong>{formatPrice(product.pix)}</strong></div>{orderError && <p className="checkout-order-error" role="alert"><i className="bi bi-exclamation-circle" /> {orderError}</p>}<button className={`checkout-submit ${formComplete ? "ready" : ""}`} type="submit" disabled={orderSaving}>{orderSaving ? <>Registrando pedido <i className="bi bi-arrow-repeat" /></> : ctaLabel}</button><p className="checkout-submit-note"><i className="bi bi-shield-lock" /> Você só paga quando confirmar no aplicativo do seu banco.</p></section>
        </form>
      </div> : stage === "processing" ? <div className="checkout-processing" role="status" aria-live="polite">
        <section className="checkout-processing-card">
          <div className="checkout-processing-mark"><span><i className="pix-symbol" aria-hidden="true" /></span></div>
          <span className="checkout-processing-kicker">CHECKOUT IZZAT</span>
          <h1>Preparando seu Pix</h1>
          <p>{processingStep === 0 ? "Conferindo os dados do pedido..." : processingStep === 1 ? "Preparando sua compra com segurança..." : "Gerando as informações de pagamento..."}</p>
          <div className="checkout-processing-bar" aria-hidden="true"><span /></div>
          <div className="checkout-processing-steps">
            {["Dados conferidos", "Pedido preparado", "Pix sendo gerado"].map((label, index) => <div className={index < processingStep ? "complete" : index === processingStep ? "active" : ""} key={label}><span>{index < processingStep ? <i className="bi bi-check-lg" /> : index + 1}</span><b>{label}</b></div>)}
          </div>
          <small><i className="bi bi-shield-lock" /> Não feche esta janela. Leva apenas alguns segundos.</small>
        </section>
      </div> : <div className="pix-payment-screen">
        <div className="pix-payment-status"><i className="bi bi-shield-check" /><span>Pagamento via Pix</span><strong>Confira o valor antes de pagar</strong></div>
        <div className="pix-greeting"><span className="pix-success-icon"><i className="bi bi-check-lg" /></span><h1>Quase lá, {customerFirstName}!</h1><p>Copie o código abaixo e finalize o pagamento no aplicativo do seu banco.</p></div>
        <section className="pix-code-card"><div className="pix-card-title"><i className="pix-symbol" aria-hidden="true" /><div><h2>Pix Copia e Cola</h2><p>Código exclusivo deste pedido</p></div></div>{settings.pixCode ? <code>{settings.pixCode}</code> : <div className="pix-not-configured"><i className="bi bi-exclamation-triangle" /><div><b>Código Pix ainda não configurado</b><span>Adicione o código deste produto no painel administrativo.</span></div></div>}<button type="button" onClick={() => void copyPix()} disabled={!settings.pixCode} className={copied ? "copied" : ""}><i className={`bi ${copied ? "bi-check2" : "bi-copy"}`} /> {copied ? "Código copiado!" : "Copiar código Pix"}</button><div className="pix-total"><span>Valor total — sem taxas adicionais</span><strong>{formatPrice(product.pix)}</strong></div></section>
        <section className="pix-order-card"><h2><i className="bi bi-box-seam" /> Meu pedido</h2><div><img src={imageForSize(product.image, 180)} width={180} height={180} alt="" loading="lazy" decoding="async" /><div><b>{settings.title}</b><span>Quantidade: 1</span><strong>{formatPrice(product.pix)}</strong></div></div><p><i className="bi bi-truck" /><span>Prazo de entrega estimado<b>{settings.delivery}</b></span><em>GRÁTIS</em></p></section>
        <section className="pix-how-to"><h2>Como pagar</h2>{[["Copie o código", "Toque no botão acima para copiar o Pix."], ["Abra o app do banco", "Entre na área Pix do seu banco ou carteira."], ["Escolha Pix Copia e Cola", "Cole o código que você acabou de copiar."], ["Confirme o pagamento", "Confira o valor e conclua a transação."]].map(([title, text], index) => <div key={title}><span>{index + 1}</span><p><b>{title}</b><small>{text}</small></p></div>)}</section>
        <div className="pix-order-id">Pedido {orderId}</div>
      </div>}
    </div>
    {stage === "form" && formComplete && !keyboardOpen && <div className="checkout-mobile-cta"><div><span>Total no Pix</span><strong>{formatPrice(product.pix)}</strong></div><button type="submit" form={checkoutFormId} disabled={orderSaving}>{orderSaving ? "Registrando…" : "Continuar para o Pix"}</button></div>}
  </div>;
}

function ProductPage({ product, products, onBack, onAdd, onOpen }: { product: Product; products: Product[]; onBack: () => void; onAdd: (product: Product & { quantity?: number }) => void; onOpen: (product: Product) => void }) {
  const trackedProductView = useRef<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [cep, setCep] = useState("");
  const [shipping, setShipping] = useState(false);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [directCheckoutOpen, setDirectCheckoutOpen] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [publishedReviews, setPublishedReviews] = useState<Review[]>(initialReviews);
  const galleryImages = product.gallery?.length ? product.gallery : [product.image];
  const approvedReviews = publishedReviews.filter((review) => review.productId === product.id && review.approved);
  const reviewAverage = approvedReviews.length ? approvedReviews.reduce((sum, review) => sum + review.rating, 0) / approvedReviews.length : 0;
  useEffect(() => { setActiveImage(0); setShowAllReviews(false); }, [product.id]);
  useEffect(() => {
    if (trackedProductView.current === product.id) return;
    trackedProductView.current = product.id;
    trackProductEvent(product, "ViewContent");
  }, [product]);
  useEffect(() => {
    const savedReviews = window.localStorage.getItem("izzat-reviews") ?? window.localStorage.getItem("woozen-reviews");
    if (savedReviews) {
      try { setPublishedReviews(JSON.parse(savedReviews) as Review[]); return; } catch { /* tenta a fonte compartilhada */ }
    }
    const controller = new AbortController();
    void fetch("/api/store", { signal: controller.signal })
      .then((response) => response.ok ? response.json() : null)
      .then((payload: { store?: { reviews?: Review[] } } | null) => {
        if (Array.isArray(payload?.store?.reviews)) setPublishedReviews(payload.store.reviews);
      })
      .catch(() => { /* mantém as avaliações iniciais */ });
    return () => controller.abort();
  }, [product.id]);
  const showPreviousImage = () => setActiveImage((current) => current === 0 ? galleryImages.length - 1 : current - 1);
  const showNextImage = () => setActiveImage((current) => current === galleryImages.length - 1 ? 0 : current + 1);
  const openDirectCheckout = () => {
    trackProductEvent(product, "InitiateCheckout");
    setDirectCheckoutOpen(true);
  };
  let touchStart = 0;
  return <main className="product-page">
    <div className="container">
      <div className="breadcrumbs"><button onClick={onBack}>Página inicial</button> <span>/</span> Todos os produtos <span>/</span> {product.name}</div>
      <section className="product-detail">
        <div className="gallery">
          <div className="thumbs" aria-label="Galeria de imagens">{galleryImages.map((image, index) => <button className={activeImage === index ? "selected" : ""} key={index} onClick={() => setActiveImage(index)} aria-label={`Exibir imagem ${index + 1}`}><img src={imageForSize(image, 180)} alt="" loading="lazy" decoding="async" /></button>)}</div>
          <div className="main-product-image" onTouchStart={(event) => { touchStart = event.changedTouches[0].clientX; }} onTouchEnd={(event) => { const distance = event.changedTouches[0].clientX - touchStart; if (Math.abs(distance) > 35) distance > 0 ? showPreviousImage() : showNextImage(); }}>
            <img
              src={imageForSize(galleryImages[activeImage], 760)}
              srcSet={imageSrcSet(galleryImages[activeImage], [480, 760, 1000])}
              sizes="(max-width: 720px) 100vw, 56vw"
              width={1000}
              height={1000}
              alt={product.name}
              decoding="async"
              fetchPriority="high"
            />
            {galleryImages.length > 1 && <span className="swipe-hint"><i className="bi bi-arrow-left-right" /> Deslize para ver mais</span>}
            <div className="gallery-dots" aria-hidden="true">{galleryImages.map((_, index) => <span className={activeImage === index ? "active" : ""} key={index} />)}</div>
          </div>
        </div>
        <div className="purchase-panel">
          <div className="product-heading">
            <span className="detail-kicker">Novo | {product.sold.toLocaleString("pt-BR")} Vendidos</span>
            <h1>{product.name}<i className="bi bi-check-circle-fill" aria-label="Produto verificado" /></h1>
            <div className="product-identification"><span>(Cód. Item {String(35269577 + product.id).padStart(8, "0")})</span><b>Disponível em estoque.</b></div>
            {approvedReviews.length > 0 && <a className="product-review-summary" href="#avaliacoes"><span>{"★".repeat(Math.round(reviewAverage))}{"☆".repeat(5 - Math.round(reviewAverage))}</span><strong>{reviewAverage.toFixed(1)}</strong><small>{approvedReviews.length} avaliações verificadas</small><i className="bi bi-chevron-right" /></a>}
          </div>
          <ProductPrice product={product} />
          <div className="stock"><span /> Em estoque — envio imediato</div>
          <div className="quantity-row"><span>Quantidade</span><div><button onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button><b>{quantity}</b><button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}>+</button></div></div>
          <button className="buy-now" onClick={openDirectCheckout}>Comprar agora</button>
          <button className="whatsapp-button" onClick={() => onAdd({ ...product, quantity })}>♧ Comprar pelo WhatsApp</button>
          <div className="safe-note">▣ Compra garantida · Você tem até 30 dias de garantia<br />↻ Troca Grátis · Você tem até 7 dias para trocar o produto</div>
          <div className="shipping-box"><b>Calcule o frete e prazo de entrega</b><div><input value={cep} onChange={(event) => { setCep(formatCep(event.target.value)); setShipping(false); }} placeholder="Digite seu CEP" inputMode="numeric" maxLength={9} /><button disabled={shippingLoading} onClick={() => { if (onlyDigits(cep).length !== 8) return; setShipping(false); setShippingLoading(true); window.setTimeout(() => { setShippingLoading(false); setShipping(true); }, 650); }}>{shippingLoading ? <><i className="bi bi-arrow-repeat" /> Calculando</> : "Consultar"}</button></div>{shipping && <div className="shipping-result" role="status" aria-live="polite"><span><i className="bi bi-truck" /></span><div><small>Entrega disponível</small><b>Frete grátis</b><p>Receba em até 5 dias úteis após a confirmação do pagamento.</p></div><em>GRÁTIS</em></div>}</div>
        </div>
      </section>
      <section className="description"><h2>Descrição</h2><p className="description-title">{product.name.toUpperCase()}</p><p>{product.description} Com design moderno e acabamento resistente, é uma escolha prática para deixar a rotina mais leve e confortável.</p><h3>Características</h3><ul><li>Material resistente, apropriado para uso diário.</li><li>Design funcional e fácil de limpar.</li><li>Compacto para guardar e transportar.</li><li>Produto testado e pronto para uso.</li></ul><h3>Especificações</h3><p>Voltagem: bivolt · Capacidade: 300ml · Material: plástico e aço inox · Garantia: 90 dias</p><h3>Itens inclusos</h3><p>1 produto · Manual de instruções · Embalagem original</p></section>
      {approvedReviews.length > 0 && <section className="product-reviews" id="avaliacoes">
        <div className="product-reviews-heading"><div><span className="detail-kicker">AVALIAÇÕES VERIFICADAS</span><h2>Quem comprou, recomenda</h2></div><div className="product-review-score"><strong>{reviewAverage.toFixed(1)}</strong><span>{"★".repeat(Math.round(reviewAverage))}{"☆".repeat(5 - Math.round(reviewAverage))}</span><small>{approvedReviews.length} avaliações</small></div></div>
        <div className={`product-review-list ${showAllReviews ? "show-all" : ""}`}>{approvedReviews.map((review) => <article key={review.id}><div className="product-review-card-head">{review.avatar ? <img className="review-avatar review-avatar-photo" src={review.avatar} alt={`Foto de ${review.name}`} loading="lazy" decoding="async" /> : <span className="review-avatar">{review.name.trim().charAt(0).toUpperCase()}</span>}<div><b>{review.name}</b><small>Compra verificada</small></div><span className="review-stars">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span></div><p>{review.comment}</p>{Boolean(review.media?.length) && <div className="review-customer-media">{review.media?.map((media, index) => <button type="button" key={`${review.id}-${index}`} onClick={() => window.open(media, "_blank", "noopener,noreferrer")} aria-label={`Abrir mídia ${index + 1} da avaliação de ${review.name}`}><img src={media} alt={`Mídia enviada por ${review.name}`} loading="lazy" decoding="async" /></button>)}</div>}<time>Comprado em {new Date(`${review.purchaseDate || review.date}T12:00:00`).toLocaleDateString("pt-BR")}</time></article>)}</div>
        {approvedReviews.length > 3 && <button className="product-reviews-toggle" onClick={() => setShowAllReviews(!showAllReviews)}>{showAllReviews ? "Ver menos avaliações" : `Ver mais avaliações (${approvedReviews.length - 3})`}<i className={`bi bi-chevron-${showAllReviews ? "up" : "down"}`} /></button>}
      </section>}
      <section className="related"><div className="section-heading"><h2>Você também pode gostar</h2></div><div className="product-grid related-grid">{products.slice(0, 6).map((item) => <ProductCard key={item.id} product={item} onOpen={onOpen} onAdd={onAdd} />)}</div></section>
    </div>
    {directCheckoutOpen && <CheckoutFlow product={product} reviews={publishedReviews} onClose={() => setDirectCheckoutOpen(false)} />}
  </main>;
}


type FooterInfoKey = "about" | "contact" | "privacy" | "payment" | "returns" | "shipping" | "tracking";

const footerInfoContent: Record<FooterInfoKey, { icon: string; title: string; intro: string; sections: Array<{ title: string; text: string }> }> = {
  about: { icon: "bi-shop-window", title: "Quem somos", intro: "A Izzat Express é uma loja online criada para tornar boas compras mais simples, seguras e acessíveis.", sections: [{ title: "Nossa proposta", text: "Selecionamos utilidades, eletrônicos, itens para casa e produtos que facilitam a rotina. Trabalhamos com informações claras, preços transparentes e uma experiência pensada principalmente para o celular." }, { title: "Nosso compromisso", text: "Queremos que você compre com confiança, acompanhe seu pedido e encontre atendimento quando precisar. Cada produto possui descrição, condições de pagamento e prazo de entrega apresentados antes da finalização." }] },
  contact: { icon: "bi-headset", title: "Fale conosco", intro: "Nossa equipe está disponível para ajudar antes, durante e depois da sua compra.", sections: [{ title: "Canais de atendimento", text: "E-mail: suporte@izzat.com.br\nWhatsApp: (37) 9 9863-6406" }, { title: "Para agilizar", text: "Ao entrar em contato sobre uma compra, informe o número do pedido e o e-mail utilizado no checkout. Nunca solicitamos senha, código bancário ou acesso ao seu aplicativo." }] },
  privacy: { icon: "bi-shield-lock", title: "Política de privacidade", intro: "Tratamos seus dados com responsabilidade e usamos apenas as informações necessárias para operar a loja.", sections: [{ title: "Dados utilizados", text: "Nome, contato, endereço e informações do pedido são usados para processar a compra, organizar a entrega, prestar atendimento e prevenir fraudes. Dados de navegação podem ser utilizados para melhorar a experiência e medir campanhas." }, { title: "Proteção e direitos", text: "Aplicamos medidas de segurança e não comercializamos seus dados pessoais. Você pode solicitar informações, correção ou exclusão quando aplicável pelo e-mail suporte@izzat.com.br." }] },
  payment: { icon: "bi-qr-code", title: "Política de pagamento", intro: "No momento, a Izzat Express trabalha exclusivamente com pagamento via Pix.", sections: [{ title: "Como funciona", text: "Após preencher o checkout, você recebe o código Pix Copia e Cola referente ao produto escolhido. Confira o produto e o valor antes de confirmar no aplicativo do seu banco." }, { title: "Confirmação segura", text: "O pedido permanece como Aguardando Pix até a confirmação do pagamento. A Izzat Express não solicita transferências para códigos enviados por perfis ou sites não oficiais." }] },
  returns: { icon: "bi-arrow-left-right", title: "Trocas e devoluções", intro: "Queremos que sua experiência continue tranquila mesmo quando algo não sair como esperado.", sections: [{ title: "Direito de arrependimento", text: "Para compras online, a solicitação de devolução pode ser feita em até 7 dias corridos após o recebimento. Entre em contato informando o número do pedido e o motivo." }, { title: "Produto com problema", text: "Se o item chegar avariado, diferente do pedido ou apresentar defeito, preserve a embalagem e envie fotos ou vídeos. Nossa equipe analisará o caso e orientará os próximos passos." }] },
  shipping: { icon: "bi-truck", title: "Entregas e frete", intro: "Enviamos os pedidos para todo o Brasil com acompanhamento e informações claras durante o processo.", sections: [{ title: "Prazo de entrega", text: "A estimativa aparece no checkout e começa após a confirmação do pagamento. O prazo pode variar conforme CEP, disponibilidade e operação da transportadora." }, { title: "Endereço e recebimento", text: "Revise CEP, rua e número antes de gerar o Pix. É importante haver uma pessoa autorizada no local para receber o pedido." }] },
  tracking: { icon: "bi-geo-alt", title: "Rastrear pedido", intro: "O acompanhamento ficará disponível assim que o envio for processado.", sections: [{ title: "Localize sua compra", text: "Tenha em mãos o número do pedido e o e-mail utilizado na compra. Quando o código de rastreio estiver disponível, ele será vinculado ao pedido." }, { title: "Precisa de ajuda?", text: "Fale conosco pelo e-mail suporte@izzat.com.br ou WhatsApp (37) 9 9863-6406." }] },
};

function FooterInfoModal({ infoKey, onClose }: { infoKey: FooterInfoKey; onClose: () => void }) {
  const info = footerInfoContent[infoKey];
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", closeOnEscape); };
  }, [onClose]);
  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="footer-info-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <article className="footer-info-modal" role="dialog" aria-modal="true" aria-labelledby="footer-info-title">
        <header>
          <span><i className={`bi ${info.icon}`} /></span>
          <div><small>IZZAT EXPRESS</small><h2 id="footer-info-title">{info.title}</h2></div>
          <button type="button" onClick={onClose} aria-label="Fechar">×</button>
        </header>
        <div className="footer-info-scroll">
          <p className="footer-info-intro">{info.intro}</p>
          <div className="footer-info-sections">{info.sections.map((section) => <section key={section.title}><h3>{section.title}</h3>{section.text.split("\n").map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</section>)}</div>
        </div>
        <footer><i className="bi bi-shield-check" /><span>Informações da loja oficial Izzat Express</span><button type="button" className="primary-button" onClick={onClose}>Entendi</button></footer>
      </article>
    </div>,
    document.body,
  );
}

function ProfessionalFooter() {
  const [activeInfo, setActiveInfo] = useState<FooterInfoKey | null>(null);
  const openInfo = (infoKey: FooterInfoKey) => setActiveInfo(infoKey);
  return <footer><div className="footer-benefits"><div><i className="bi bi-truck" /><b>Frete grátis para todo o Brasil</b><small>Entrega acompanhada até o seu endereço.</small></div><div><i className="bi bi-cart3" /><b>Pedido monitorado</b><small>Acompanhe as etapas com nosso atendimento.</small></div><div><i className="bi bi-headset" /><b>Precisa de atendimento?</b><small>Fale com nossa equipe antes ou depois da compra.</small></div><div><i className="bi bi-credit-card-2-front" /><b>Compra segura</b><small>Checkout protegido e pagamento via Pix.</small></div></div><div className="footer-main"><div><div className="footer-logo"><img className="brand-logo" src="/izzat-logo.png" alt="Izzat Express" /></div><h4>CENTRAL DE ATENDIMENTO</h4><b>Atendimento ao consumidor</b><p><b>E-mail:</b> suporte@izzat.com.br<br /><b>WhatsApp:</b> (37) 9 9863-6406</p><button type="button" className="footer-contact-button" onClick={() => openInfo("contact")}><i className="bi bi-chat-dots" /> Falar com a Izzat</button></div><div><h4>INSTITUCIONAL</h4><button type="button" className="footer-link" onClick={() => openInfo("about")}>Quem Somos</button><button type="button" className="footer-link" onClick={() => openInfo("contact")}>Fale Conosco</button><button type="button" className="footer-link" onClick={() => openInfo("privacy")}>Política de Privacidade</button></div><div><h4>DÚVIDAS FREQUENTES</h4><button type="button" className="footer-link" onClick={() => openInfo("payment")}>Política de Pagamento</button><button type="button" className="footer-link" onClick={() => openInfo("returns")}>Trocas e Devoluções</button><button type="button" className="footer-link" onClick={() => openInfo("shipping")}>Entregas e Frete</button><button type="button" className="footer-link" onClick={() => openInfo("tracking")}>Rastrear Pedidos</button></div><div><h4>RECEBA NOSSAS NOVIDADES</h4><p>Cadastre seu e-mail para acompanhar lançamentos e condições especiais.</p><form onSubmit={(event) => event.preventDefault()}><input type="email" placeholder="Seu melhor e-mail" aria-label="Seu e-mail" required /><button type="submit">Quero receber</button></form><small className="footer-consent">Cancele o recebimento quando quiser.</small></div></div><div className="footer-bottom"><p>Avenida Antônio Olímpio de Moraes, 545 · Sala 710 · Centro · Divinópolis/MG · CEP 35.500-900<br />Compre somente pelos canais oficiais da Izzat Express. Confira o produto e o valor antes de pagar.</p><div className="socials"><i className="bi bi-facebook" aria-label="Facebook" /> <i className="bi bi-twitter-x" aria-label="X" /> <i className="bi bi-instagram" aria-label="Instagram" /> <i className="bi bi-tiktok" aria-label="TikTok" /></div></div><div className="copyright">Izzat Express © 2026 · Todos os direitos reservados</div>{activeInfo && <FooterInfoModal infoKey={activeInfo} onClose={() => setActiveInfo(null)} />}</footer>;
}

export default function Storefront({ initialScreen = "home" }: { initialScreen?: Screen }) {
  const sharedCatalogReady = useRef(false);
  const lastSyncedStore = useRef("");
  const [screen, setScreen] = useState<Screen>(initialScreen);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [selectedProduct, setSelectedProduct] = useState<Product>(initialProducts[0]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("Todos");
  const [announcement, setAnnouncement] = useState("Frete grátis para São Paulo, SP e Região");
  const [heroTitle, setHeroTitle] = useState("BLACK FRIDAY");
  const [catalogRelease, setCatalogRelease] = useState("");

  useEffect(() => {
    const saved = window.localStorage.getItem("izzat-products") ?? window.localStorage.getItem("woozen-products");
    if (saved && window.localStorage.getItem("izzat-catalog-release") === CATALOG_RELEASE) {
      try {
        setProducts(JSON.parse(saved) as Product[]);
      } catch { /* dados inválidos, usa catálogo inicial */ }
    }
    void fetch("/api/store").then((response) => response.ok ? response.json() : { store: null }).then((payload: { store?: (StoreSnapshot & { updatedAt?: string }) | null }) => {
      if (!payload.store) { sharedCatalogReady.current = true; setCatalogRelease(CATALOG_RELEASE); return; }
      sharedCatalogReady.current = true;
      const usesCurrentCatalog = payload.store.settings?.catalogRelease === CATALOG_RELEASE;
      const nextProducts = usesCurrentCatalog && payload.store.products?.length ? payload.store.products : initialProducts;
      const nextReviews = usesCurrentCatalog && Array.isArray(payload.store.reviews) ? payload.store.reviews : initialReviews;
      const nextAnnouncement = payload.store.settings?.announcement || "Frete grátis para São Paulo, SP e Região";
      const nextHeroTitle = payload.store.settings?.heroTitle || "BLACK FRIDAY";
      const snapshot: StoreSnapshot = { products: nextProducts, reviews: nextReviews, settings: { announcement: nextAnnouncement, heroTitle: nextHeroTitle, catalogRelease: CATALOG_RELEASE } };
      lastSyncedStore.current = JSON.stringify(snapshot);
      setProducts(nextProducts);
      setReviews(nextReviews);
      setAnnouncement(nextAnnouncement);
      setHeroTitle(nextHeroTitle);
      setCatalogRelease(CATALOG_RELEASE);
    }).catch(() => { /* sem conexão usa a cópia local */ }).finally(() => { sharedCatalogReady.current = true; });
    const savedReviews = window.localStorage.getItem("izzat-reviews") ?? window.localStorage.getItem("woozen-reviews");
    if (savedReviews) {
      try { setReviews(JSON.parse(savedReviews) as Review[]); } catch { /* dados inválidos, usa avaliações iniciais */ }
    }
    const onHome = () => { window.history.pushState({}, "", "/"); setScreen("home"); setCategory("Todos"); window.scrollTo({ top: 0, behavior: "smooth" }); };
    const onCart = () => setCartOpen(true);
    const onCategory = (event: Event) => { const value = (event as CustomEvent<string>).detail; setCategory(value); setSearchTerm(""); setScreen("category"); window.scrollTo({ top: 0, behavior: "smooth" }); };
    const onPopState = () => setScreen(window.location.pathname === "/admin" ? "admin" : "home");
    const onStorage = (event: StorageEvent) => {
      if ((event.key === "izzat-products" || event.key === "woozen-products") && event.newValue) {
        try { setProducts(JSON.parse(event.newValue) as Product[]); } catch { /* mantém o catálogo atual */ }
      }
      if ((event.key === "izzat-reviews" || event.key === "woozen-reviews") && event.newValue) {
        try { setReviews(JSON.parse(event.newValue) as Review[]); } catch { /* mantém as avaliações atuais */ }
      }
    };
    if (window.location.pathname === "/admin") setScreen("admin");
    window.addEventListener("go-home", onHome); window.addEventListener("open-cart", onCart); window.addEventListener("category", onCategory); window.addEventListener("popstate", onPopState); window.addEventListener("storage", onStorage);
    return () => { window.removeEventListener("go-home", onHome); window.removeEventListener("open-cart", onCart); window.removeEventListener("category", onCategory); window.removeEventListener("popstate", onPopState); window.removeEventListener("storage", onStorage); };
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("izzat-products", JSON.stringify(products));
      window.localStorage.setItem("izzat-reviews", JSON.stringify(reviews));
      window.localStorage.setItem("izzat-catalog-release", CATALOG_RELEASE);
    } catch {
      // O KV continua como fonte principal se o armazenamento do aparelho estiver cheio.
    }

    if (!sharedCatalogReady.current || screen !== "admin") return;
    const snapshot: StoreSnapshot = { products, reviews, settings: { announcement, heroTitle, catalogRelease: CATALOG_RELEASE } };
    const serialized = JSON.stringify(snapshot);
    if (serialized === lastSyncedStore.current) return;

    const saveTimer = window.setTimeout(() => {
      void fetch("/api/admin/store", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: serialized,
        keepalive: true,
      }).then((response) => {
        if (response.ok) lastSyncedStore.current = serialized;
      }).catch(() => { /* mantém a cópia local se a rede estiver indisponível */ });
    }, 1100);
    return () => window.clearTimeout(saveTimer);
  }, [products, reviews, announcement, heroTitle, catalogRelease, screen]);
  const filteredProducts = useMemo(() => products.filter((product) => (category === "Todos" || product.category === category) && (!searchTerm || `${product.name} ${product.category}`.toLowerCase().includes(searchTerm.toLowerCase()))), [products, category, searchTerm]);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const addToCart = (product: Product & { quantity?: number }) => { const amount = product.quantity ?? 1; setCart((items) => { const existing = items.find((item) => item.id === product.id); return existing ? items.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + amount } : item) : [...items, { ...product, quantity: amount }]; }); setCartOpen(true); };
  const openProduct = (product: Product) => { setSelectedProduct(product); setScreen("product"); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const doSearch = () => { setCategory("Todos"); setScreen("category"); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const adminPanel = screen === "admin" ? (
    <Suspense fallback={<main className="admin-page"><div className="admin-orders-loading"><i className="bi bi-arrow-repeat" /><span>Carregando painel...</span></div></main>}>
      <AdminPanel products={products} setProducts={setProducts} reviews={reviews} setReviews={setReviews} announcement={announcement} setAnnouncement={setAnnouncement} heroTitle={heroTitle} setHeroTitle={setHeroTitle} onExit={() => { window.history.pushState({}, "", "/"); setScreen("home"); }} />
    </Suspense>
  ) : null;
  if (screen === "admin") return <div className="site-shell">{adminPanel}</div>;

  return <div className="site-shell"><Header cartCount={cartCount} searchTerm={searchTerm} setSearchTerm={setSearchTerm} onSearch={doSearch} onOpenAccount={() => setAccountOpen(true)} onHome={() => { window.history.pushState({}, "", "/"); setScreen("home"); setCategory("Todos"); }} />{screen === "home" && <HomePage products={products} onOpen={openProduct} onAdd={addToCart} heroTitle={heroTitle} heroSubtitle="Até 40% de desconto" />}{screen === "product" && <ProductPage product={selectedProduct} products={products} onBack={() => setScreen("home")} onAdd={addToCart} onOpen={openProduct} />}{screen === "category" && <main className="category-page"><div className="container"><div className="breadcrumbs">Página inicial <span>/</span> {category === "Todos" ? "Todos os produtos" : category}</div><div className="category-heading"><div><span className="detail-kicker">CATÁLOGO IZZAT</span><h1>{searchTerm ? `Resultados para “${searchTerm}”` : category === "Todos" ? "Todos os produtos" : category}</h1><p>{filteredProducts.length} produtos encontrados para você.</p></div><select><option>Mais relevantes</option><option>Menor preço</option><option>Maior preço</option></select></div><div className="category-layout"><aside className="filters"><h3>Filtre por</h3><b>Categoria</b>{categories.map((item) => <button className={category === item.name ? "selected" : ""} key={item.name} onClick={() => setCategory(item.name)}>{item.name}<span>›</span></button>)}<b>Disponibilidade</b><label><input type="checkbox" /> Em estoque</label><label><input type="checkbox" /> Frete grátis</label></aside><div className="product-grid category-grid">{filteredProducts.length ? filteredProducts.map((product) => <ProductCard key={product.id} product={product} onOpen={openProduct} onAdd={addToCart} />) : <div className="empty-state"><span>⌕</span><h2>Nenhum produto encontrado</h2><p>Tente buscar por outro termo ou categoria.</p></div>}</div></div></div></main>}<ProfessionalFooter />{accountOpen && <AccountAccess onClose={() => setAccountOpen(false)} />}<aside className={`cart-drawer ${cartOpen ? "open" : ""}`}><div className="drawer-heading"><div><span className="muted">Sua compra</span><h2>Sacola <small>{cartCount} item(s)</small></h2></div><button onClick={() => setCartOpen(false)}>×</button></div><div className="drawer-items">{cart.length ? cart.map((item) => <div className="drawer-item" key={item.id}><img src={imageForSize(item.image, 180)} width={180} height={180} alt="" loading="lazy" decoding="async" /><div><b>{item.name}</b><small>{formatPrice(item.price)}</small><div><button onClick={() => setCart(cart.map((current) => current.id === item.id ? { ...current, quantity: Math.max(1, current.quantity - 1) } : current))}>−</button><span>{item.quantity}</span><button onClick={() => setCart(cart.map((current) => current.id === item.id ? { ...current, quantity: current.quantity + 1 } : current))}>+</button><button className="remove-item" onClick={() => setCart(cart.filter((current) => current.id !== item.id))}>Remover</button></div></div></div>) : <div className="empty-cart"><span>🛒</span><h3>Sua sacola está vazia</h3><p>Adicione produtos incríveis para continuar.</p></div>}</div>{cart.length > 0 && <div className="drawer-footer"><div><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div><small>Frete calculado no checkout</small><button className="primary-button" onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}>Ir para o checkout</button></div>}</aside>{cartOpen && <button className="drawer-backdrop" aria-label="Fechar sacola" onClick={() => setCartOpen(false)} />}{checkoutOpen && <div className="modal-backdrop"><div className="checkout-modal"><div className="modal-heading"><div><span className="muted">Finalizar compra</span><h2>Checkout seguro</h2></div><button onClick={() => setCheckoutOpen(false)}>×</button></div><div className="checkout-steps"><span className="active">1 Identificação</span><span>2 Entrega</span><span>3 Pagamento</span></div><div className="checkout-form"><label>Seu nome<input placeholder="Digite seu nome completo" /></label><label>E-mail<input placeholder="voce@email.com" type="email" /></label><label>CEP<input placeholder="00000-000" /></label><label>Endereço<input placeholder="Rua, número e complemento" /></label><div className="checkout-summary"><span>Produtos ({cartCount})</span><strong>{formatPrice(subtotal)}</strong><span>Frete</span><strong className="free">Grátis</strong><b>Total</b><b>{formatPrice(subtotal)}</b></div><button className="primary-button" onClick={() => { setCheckoutOpen(false); setCart([]); alert("Pedido recebido! Enviaremos a confirmação para seu e-mail."); }}>Continuar para pagamento</button></div></div></div>}</div>;
}
