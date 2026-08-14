"use client";

import { useEffect, useState } from "react";
import {
  checkoutText,
  formatPrice,
  initialProducts,
  type Product,
  type Review,
} from "./page";

type CheckoutCustomer = {
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

type AdminOrder = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: "pix_pending" | "paid" | "cancelled";
  customer: CheckoutCustomer;
  product: { id: number; name: string; image: string; quantity: number; price: number; pix: number };
};

function splitImportedRow(row: string, delimiter: string) {
  const values: string[] = [];
  let value = "";
  let insideQuotes = false;
  for (let index = 0; index < row.length; index += 1) {
    const character = row[index];
    if (character === '"') {
      if (insideQuotes && row[index + 1] === '"') { value += '"'; index += 1; } else insideQuotes = !insideQuotes;
    } else if (character === delimiter && !insideQuotes) {
      values.push(value.trim());
      value = "";
    } else value += character;
  }
  values.push(value.trim());
  return values;
}

function reviewsFromImport(content: string, fallbackProductId: number) {
  const text = content.trim();
  if (!text) return [] as Review[];
  const createReview = (source: Record<string, unknown>, index: number): Review | null => {
    const productId = Number(source.produto_id ?? source.product_id ?? source.productId ?? source.id_produto ?? fallbackProductId);
    if (!productId) return null;
    const rating = Math.max(1, Math.min(5, Number(source.nota ?? source.rating ?? 5) || 5));
    const approvedValue = String(source.aprovado ?? source.approved ?? "true").toLowerCase();
    return {
      id: Date.now() + index,
      productId,
      name: String(source.nome ?? source.name ?? "Cliente Izzat"),
      rating,
      comment: String(source.comentario ?? source.comment ?? source.avaliacao ?? ""),
      date: String(source.data ?? source.date ?? new Date().toISOString().slice(0, 10)),
      approved: !["false", "0", "não", "nao", "pendente"].includes(approvedValue),
      purchaseDate: String(source.data_compra ?? source.purchase_date ?? source.purchaseDate ?? source.data ?? source.date ?? new Date().toISOString().slice(0, 10)),
      avatar: String(source.avatar ?? source.foto_avatar ?? ""),
      media: String(source.midias ?? source.mídias ?? source.media ?? source.fotos ?? "").split("|").map((item) => item.trim()).filter(Boolean),
    };
  };
  if (text.startsWith("[")) {
    try {
      const data = JSON.parse(text);
      return Array.isArray(data) ? data.map((item, index) => createReview(item as Record<string, unknown>, index)).filter((item): item is Review => Boolean(item)) : [];
    } catch { return []; }
  }
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const delimiter = lines[0].includes(";") ? ";" : ",";
  const headers = splitImportedRow(lines[0], delimiter).map((header) => header.trim().toLowerCase());
  return lines.slice(1).map((line, index) => {
    const values = splitImportedRow(line, delimiter);
    const source = Object.fromEntries(headers.map((header, column) => [header, values[column] ?? ""]));
    return createReview(source, index);
  }).filter((item): item is Review => Boolean(item));
}

function ReviewsAdmin({ products, reviews, setReviews, activeProductId }: { products: Product[]; reviews: Review[]; setReviews: (reviews: Review[]) => void; activeProductId: number | null }) {
  const [selectedProductId, setSelectedProductId] = useState(activeProductId ?? products[0]?.id ?? 0);
  const [message, setMessage] = useState("");
  const [newReview, setNewReview] = useState({ name: "", rating: 5, comment: "" });
  useEffect(() => { if (activeProductId) setSelectedProductId(activeProductId); }, [activeProductId]);
  const selectedProduct = products.find((product) => product.id === selectedProductId);
  const productReviews = reviews.filter((review) => review.productId === selectedProductId);
  const average = productReviews.length ? productReviews.reduce((sum, review) => sum + review.rating, 0) / productReviews.length : 0;

  const importReviews = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    const imported = reviewsFromImport(await file.text(), selectedProductId);
    if (!imported.length) { setMessage("Não foi possível encontrar avaliações válidas nesse arquivo."); return; }
    setReviews([...reviews, ...imported]);
    setMessage(`${imported.length} avaliações importadas para ${selectedProduct?.name ?? "o produto"}.`);
  };
  const addReview = () => {
    if (!newReview.name.trim() || !newReview.comment.trim()) { setMessage("Informe o nome e o comentário para adicionar a avaliação."); return; }
    setReviews([...reviews, { id: Date.now(), productId: selectedProductId, name: newReview.name.trim(), rating: newReview.rating, comment: newReview.comment.trim(), date: new Date().toISOString().slice(0, 10), approved: true }]);
    setNewReview({ name: "", rating: 5, comment: "" });
    setMessage("Avaliação adicionada.");
  };
  const toggleApproval = (id: number) => setReviews(reviews.map((review) => review.id === id ? { ...review, approved: !review.approved } : review));
  const removeReview = (id: number) => setReviews(reviews.filter((review) => review.id !== id));

  return <div className="reviews-admin"><div className="settings-card"><div className="admin-card-heading"><div><h2>Avaliações de produtos</h2><p>Importe em lote e aprove apenas as avaliações que deseja publicar.</p></div><label className="primary-button review-import-button">Importar avaliações<input type="file" accept=".csv,.json,text/csv,application/json" onChange={(event) => { void importReviews(event.target.files); event.currentTarget.value = ""; }} /></label></div><div className="reviews-product-picker"><label>Produto<select value={selectedProductId} onChange={(event) => { setSelectedProductId(Number(event.target.value)); setMessage(""); }}>{products.map((product) => <option value={product.id} key={product.id}>{product.name}</option>)}</select></label><div className="review-score"><strong>{average ? average.toFixed(1) : "–"}</strong><span>★★★★★</span><small>{productReviews.length} avaliações</small></div></div>{message && <p className="review-message">{message}</p>}<details className="import-help"><summary>Formato aceito para importação em massa</summary><p>Envie um arquivo <b>CSV</b> ou <b>JSON</b>. No CSV, use: <code>produto_id,nome,nota,comentario,data,aprovado</code>. Se não informar <code>produto_id</code>, as avaliações entram no produto selecionado.</p></details></div><div className="settings-card review-add-card"><div className="admin-card-heading"><div><h2>Adicionar avaliação</h2><p>Inclua uma avaliação manualmente neste produto.</p></div></div><div className="review-add-form"><label>Nome<input value={newReview.name} onChange={(event) => setNewReview({ ...newReview, name: event.target.value })} placeholder="Nome do cliente" /></label><label>Nota<select value={newReview.rating} onChange={(event) => setNewReview({ ...newReview, rating: Number(event.target.value) })}>{[5, 4, 3, 2, 1].map((rating) => <option value={rating} key={rating}>{rating} estrela{rating > 1 ? "s" : ""}</option>)}</select></label><label>Comentário<textarea value={newReview.comment} onChange={(event) => setNewReview({ ...newReview, comment: event.target.value })} placeholder="Escreva o comentário" /></label><button className="primary-button" onClick={addReview}>Adicionar avaliação</button></div></div><div className="settings-card"><div className="admin-card-heading"><div><h2>Avaliações cadastradas</h2><p>{selectedProduct ? selectedProduct.name : "Selecione um produto"}</p></div></div><div className="review-list">{productReviews.length ? productReviews.map((review) => <article className="review-row" key={review.id}><div className="review-row-title"><div><b>{review.name}</b><span>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)} · {review.date}</span></div><em className={review.approved ? "review-approved" : "review-pending"}>{review.approved ? "Publicada" : "Pendente"}</em></div><p>{review.comment}</p><div className="review-actions"><button className="outline-button" onClick={() => toggleApproval(review.id)}>{review.approved ? "Ocultar" : "Publicar"}</button><button className="text-danger" onClick={() => removeReview(review.id)}>Excluir</button></div></article>) : <div className="review-empty">Ainda não há avaliações para este produto.</div>}</div></div></div>;
}

function OrdersAdmin({ mode }: { mode: "orders" | "customers" }) {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const load = () => {
    setLoading(true);
    setError("");
    void fetch("/api/orders", { cache: "no-store" }).then(async (response) => {
      if (!response.ok) throw new Error("LOAD_FAILED");
      return response.json() as Promise<{ orders: AdminOrder[] }>;
    }).then((payload) => setOrders(payload.orders || [])).catch(() => setError("Não foi possível carregar os pedidos agora.")).finally(() => setLoading(false));
  };
  useEffect(load, []);
  const changeStatus = async (id: string, status: AdminOrder["status"]) => {
    const response = await fetch("/api/orders", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, status }) });
    if (response.ok) setOrders((current) => current.map((order) => order.id === id ? { ...order, status } : order));
  };
  const statusLabel = (status: AdminOrder["status"]) => status === "paid" ? "Pago" : status === "cancelled" ? "Cancelado" : "Aguardando Pix";
  const uniqueCustomers = Array.from(new Map(orders.map((order) => [order.customer.email || order.customer.phone, order])).values());

  if (loading) return <div className="admin-orders-loading"><i className="bi bi-arrow-repeat" /><span>Carregando {mode === "orders" ? "pedidos" : "clientes"}...</span></div>;
  if (error) return <div className="admin-orders-empty"><i className="bi bi-cloud-slash" /><h2>Não conseguimos carregar os dados</h2><p>{error}</p><button className="primary-button" onClick={load}>Tentar novamente</button></div>;
  if (mode === "customers") return <div className="admin-orders-wrap"><div className="order-metric-grid"><article><i className="bi bi-people" /><div><span>Clientes captados</span><strong>{uniqueCustomers.length}</strong></div></article><article><i className="bi bi-envelope-check" /><div><span>Com e-mail</span><strong>{uniqueCustomers.filter((order) => order.customer.email).length}</strong></div></article><article><i className="bi bi-whatsapp" /><div><span>Com WhatsApp</span><strong>{uniqueCustomers.filter((order) => order.customer.phone).length}</strong></div></article></div><section className="admin-orders-card"><header><div><h2>Clientes do checkout</h2><p>Dados captados quando um pedido chega à etapa do Pix.</p></div><button className="outline-button" onClick={load}><i className="bi bi-arrow-clockwise" /> Atualizar</button></header><div className="admin-customer-list">{uniqueCustomers.length ? uniqueCustomers.map((order) => <article key={order.customer.email || order.customer.phone}><span>{order.customer.name.charAt(0).toUpperCase()}</span><div><b>{order.customer.name}</b><small>{order.customer.email} · +55 {order.customer.phone}</small><em>{order.customer.city}/{order.customer.state} · Último pedido: {order.product.name}</em></div><strong>{formatPrice(order.product.pix)}</strong></article>) : <div className="admin-orders-empty compact"><i className="bi bi-person-plus" /><h2>Nenhum cliente ainda</h2><p>Os clientes aparecerão aqui quando gerarem um pedido.</p></div>}</div></section></div>;

  const pending = orders.filter((order) => order.status === "pix_pending").length;
  const paid = orders.filter((order) => order.status === "paid").length;
  const total = orders.filter((order) => order.status !== "cancelled").reduce((sum, order) => sum + order.product.pix * order.product.quantity, 0);
  return <div className="admin-orders-wrap"><div className="order-metric-grid"><article><i className="bi bi-receipt" /><div><span>Pedidos gerados</span><strong>{orders.length}</strong></div></article><article><i className="bi bi-hourglass-split" /><div><span>Aguardando Pix</span><strong>{pending}</strong></div></article><article><i className="bi bi-check-circle" /><div><span>Pagos</span><strong>{paid}</strong></div></article><article><i className="bi bi-cash-stack" /><div><span>Valor gerado</span><strong>{formatPrice(total)}</strong></div></article></div><section className="admin-orders-card"><header><div><h2>Pedidos do checkout</h2><p>Produto e dados informados pelo cliente antes da geração do Pix.</p></div><button className="outline-button" onClick={load}><i className="bi bi-arrow-clockwise" /> Atualizar</button></header><div className="admin-order-list">{orders.length ? orders.map((order) => <article className={expanded === order.id ? "expanded" : ""} key={order.id}><button className="admin-order-summary" onClick={() => setExpanded(expanded === order.id ? null : order.id)}><img src={order.product.image} alt="" /><div><b>{order.product.name}</b><small>{order.id} · {new Date(order.createdAt).toLocaleString("pt-BR")}</small></div><span><b>{order.customer.name}</b><small>{order.customer.email}</small></span><strong>{formatPrice(order.product.pix * order.product.quantity)}</strong><em className={`order-status ${order.status}`}>{statusLabel(order.status)}</em><i className={`bi bi-chevron-${expanded === order.id ? "up" : "down"}`} /></button>{expanded === order.id && <div className="admin-order-detail"><section><h3>Dados do cliente</h3><p><b>Nome:</b> {order.customer.name}</p><p><b>E-mail:</b> {order.customer.email}</p><p><b>WhatsApp:</b> +55 {order.customer.phone}</p>{order.customer.cpf && <p><b>CPF:</b> {order.customer.cpf}</p>}</section><section><h3>Endereço de entrega</h3><p>{order.customer.street}, {order.customer.number}{order.customer.complement ? ` · ${order.customer.complement}` : ""}</p><p>{order.customer.neighborhood} · {order.customer.city}/{order.customer.state}</p><p>CEP {order.customer.cep}</p></section><section><h3>Pedido</h3><p><b>Produto:</b> {order.product.name}</p><p><b>Quantidade:</b> {order.product.quantity}</p><p><b>Valor no Pix:</b> {formatPrice(order.product.pix)}</p></section><section className="order-status-actions"><h3>Status do pedido</h3><select value={order.status} onChange={(event) => { void changeStatus(order.id, event.target.value as AdminOrder["status"]); }}><option value="pix_pending">Aguardando Pix</option><option value="paid">Pago</option><option value="cancelled">Cancelado</option></select></section></div>}</article>) : <div className="admin-orders-empty compact"><i className="bi bi-receipt-cutoff" /><h2>Nenhum pedido ainda</h2><p>Quando um cliente gerar o Pix, o pedido aparecerá aqui automaticamente.</p></div>}</div></section></div>;
}

function AdminPanel({ products, setProducts, reviews, setReviews, announcement, setAnnouncement, heroTitle, setHeroTitle, onExit }: { products: Product[]; setProducts: (products: Product[]) => void; reviews: Review[]; setReviews: (reviews: Review[]) => void; announcement: string; setAnnouncement: (value: string) => void; heroTitle: string; setHeroTitle: (value: string) => void; onExit: () => void }) {
  const [section, setSection] = useState("Visão geral");
  const [editing, setEditing] = useState<Product | null>(null);
  const [saved, setSaved] = useState(false);
  const totalStock = products.reduce((sum, product) => sum + product.stock, 0);
  const nav = [["Visão geral", "⌂"], ["Produtos", "▦"], ["Pedidos", "▤"], ["Clientes", "♙"], ["Banners", "▣"], ["Categorias", "◇"], ["Configurações", "⚙"]];
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 1800); };
  const updateProduct = (next: Product, nextProductReviews: Review[]) => { setProducts(products.map((product) => product.id === next.id ? next : product)); setReviews([...reviews.filter((review) => review.productId !== next.id), ...nextProductReviews.map((review) => ({ ...review, productId: next.id }))]); setEditing(null); save(); };
  return <main className="admin-page"><aside className="admin-sidebar"><div className="admin-brand"><img className="brand-logo" src="/izzat-logo.png" alt="Izzat Express" /><small>ADMIN</small></div><div className="store-chip"><span>●</span><div><b>Minha loja</b><small>Loja publicada</small></div></div><nav>{nav.map(([name, icon]) => <button className={section === name ? "active" : ""} key={name} onClick={() => setSection(name)}><span>{icon}</span>{name}{name === "Produtos" && <em>{products.length}</em>}</button>)}</nav><button className="back-store" onClick={onExit}>↩ Ver loja</button></aside><section className="admin-content"><div className="admin-topbar"><div><span className="muted">Painel administrativo</span><h1>{section}</h1></div><div className="admin-actions"><button className="outline-button" onClick={onExit}>Ver loja ↗</button><button className="avatar" title="Sair do painel" aria-label="Sair do painel" onClick={() => { void fetch("/api/admin/auth/logout", { method: "POST" }).finally(() => window.location.replace("/admin")); }}><i className="bi bi-box-arrow-right" /></button></div></div>{section === "Visão geral" && <><div className="admin-cards"><div><span>Receita total</span><strong>R$ 48.290,40</strong><small className="positive">↗ 18,4% este mês</small></div><div><span>Pedidos</span><strong>1.248</strong><small className="positive">↗ 12,8% este mês</small></div><div><span>Ticket médio</span><strong>R$ 138,70</strong><small className="positive">↗ 6,2% este mês</small></div><div><span>Produtos vendidos</span><strong>3.842</strong><small className="positive">↗ 21,5% este mês</small></div></div><div className="admin-grid"><article className="chart-card"><div className="admin-card-heading"><div><h2>Vendas ao longo do tempo</h2><p>Receita nos últimos 30 dias</p></div><select><option>Últimos 30 dias</option><option>Últimos 7 dias</option></select></div><div className="chart"><div className="chart-bars">{[34, 47, 38, 64, 54, 73, 59, 81, 67, 92, 77, 88, 70, 96].map((height, index) => <span style={{ height: `${height}%` }} key={index} />)}</div><div className="chart-labels"><span>01 Jun</span><span>08 Jun</span><span>15 Jun</span><span>22 Jun</span><span>30 Jun</span></div></div></article><article className="best-card"><div className="admin-card-heading"><div><h2>Mais vendidos</h2><p>Produtos com melhor desempenho</p></div><button>Ver todos</button></div>{products.slice(0, 4).map((product, index) => <div className="best-product" key={product.id}><span className="rank">0{index + 1}</span><img src={product.image} alt="" /><div><b>{product.name}</b><small>{product.sold + 100} unidades vendidas</small></div><strong>{formatPrice(product.price)}</strong></div>)}</article></div><div className="admin-grid lower"><article className="admin-table-card"><div className="admin-card-heading"><div><h2>Pedidos recentes</h2><p>Últimas movimentações da loja</p></div><button>Ver pedidos</button></div><table><thead><tr><th>Pedido</th><th>Cliente</th><th>Valor</th><th>Status</th></tr></thead><tbody>{[["#IZ-10928", "Mariana Costa", "R$ 289,90", "Pago"], ["#IZ-10927", "Carlos Eduardo", "R$ 90,50", "Enviado"], ["#IZ-10926", "Ana Beatriz", "R$ 193,90", "Pago"], ["#IZ-10925", "João Pedro", "R$ 61,00", "Pendente"]].map((row) => <tr key={row[0]}>{row.map((cell, index) => <td className={index === 3 ? `status-${cell.toLowerCase()}` : ""} key={cell}>{cell}</td>)}</tr>)}</tbody></table></article><article className="low-stock"><div className="admin-card-heading"><div><h2>Estoque baixo</h2><p>Produtos que precisam de atenção</p></div></div>{products.filter((product) => product.stock < 20).slice(0, 4).map((product) => <div className="stock-row" key={product.id}><span>{product.stock}</span><div><b>{product.name}</b><small>SKU-IZ-{product.id} · {product.stock} unidades restantes</small></div></div>)}</article></div></>}{section === "Pedidos" && <OrdersAdmin mode="orders" />}{section === "Clientes" && <OrdersAdmin mode="customers" />}{section === "Produtos" && <ProductAdmin products={products} onEdit={setEditing} onCreate={() => setEditing({ ...initialProducts[0], id: Math.max(...products.map((product) => product.id)) + 1, name: "Novo produto", stock: 0, sold: 0 })} />}{section === "Banners" && <div className="settings-card"><div className="admin-card-heading"><div><h2>Banners da loja</h2><p>Gerencie o conteúdo promocional da página inicial.</p></div><button className="primary-button" onClick={save}>+ Novo banner</button></div><div className="banner-editor"><div className="banner-preview"><span>OFERTAS RELÂMPAGO</span><b>{heroTitle}</b><small>smart watches até 40% de desconto</small></div><div className="form-fields"><label>Título principal<input value={heroTitle} onChange={(event) => setHeroTitle(event.target.value)} /></label><label>Mensagem da barra superior<input value={announcement} onChange={(event) => setAnnouncement(event.target.value)} /></label><button className="primary-button" onClick={save}>Salvar alterações</button></div></div></div>}{section === "Configurações" && <div className="settings-card"><div className="admin-card-heading"><div><h2>Configurações gerais</h2><p>Personalize os textos principais da sua loja.</p></div><button className="primary-button" onClick={save}>Salvar alterações</button></div><div className="settings-form"><label>Nome da loja<input defaultValue="Izzat Express" /></label><label>Mensagem de frete grátis<input value={announcement} onChange={(event) => setAnnouncement(event.target.value)} /></label><label>WhatsApp<input defaultValue="(11) 99863-6406" /></label><label>E-mail de atendimento<input defaultValue="suporte@izzat.com.br" /></label><label>Descrição do banner<input value={heroTitle} onChange={(event) => setHeroTitle(event.target.value)} /></label></div></div>}{section !== "Visão geral" && !["Produtos", "Pedidos", "Clientes", "Banners", "Configurações"].includes(section) && <div className="empty-admin"><span>✦</span><h2>{section} em ordem</h2><p>Esta área já está preparada para você acompanhar e editar sua operação.</p><button className="primary-button" onClick={save}>Adicionar registro</button></div>}{saved && <div className="saved-toast">✓ Alterações salvas com sucesso</div>}{editing && <ProductEditor product={editing} reviews={reviews} onCancel={() => setEditing(null)} onSave={updateProduct} />}</section></main>;
}

function ProductAdmin({ products, onEdit, onCreate }: { products: Product[]; onEdit: (product: Product) => void; onCreate: () => void }) {
  return <div className="settings-card"><div className="admin-card-heading"><div><h2>Produtos <span className="count-pill">{products.length}</span></h2><p>Gerencie catálogo, preços e estoque.</p></div><button className="primary-button" onClick={onCreate}>+ Adicionar produto</button></div><div className="table-toolbar"><input placeholder="⌕ Buscar produto..." /><select><option>Todos os status</option><option>Publicado</option><option>Rascunho</option></select><button>Filtros</button></div><div className="product-admin-table"><div className="product-admin-head"><span>Produto</span><span>Categoria</span><span>Preço</span><span>Estoque</span><span>Status</span><span /></div>{products.map((product) => <div className="product-admin-row" key={product.id}><div className="admin-product-name"><img src={product.image} alt="" /><div><b>{product.name}</b><small>SKU-IZ-{String(product.id).padStart(4, "0")}</small></div></div><span>{product.category}</span><strong>{formatPrice(product.price)}</strong><span className={product.stock < 20 ? "stock-warning" : ""}>{product.stock} un.</span><span className="published"><i /> Publicado</span><button className="row-action" onClick={() => onEdit(product)}>Editar</button></div>)}</div></div>;
}

function GalleryEditor({ images, onChange }: { images: string[]; onChange: (images: string[]) => void }) {
  const [newImageUrl, setNewImageUrl] = useState("");

  const addImageUrl = () => {
    const image = newImageUrl.trim();
    if (!image) return;
    onChange([...images, image]);
    setNewImageUrl("");
  };

  const updateImage = (index: number, image: string) => onChange(images.map((current, currentIndex) => currentIndex === index ? image : current));
  const removeImage = (index: number) => {
    if (images.length === 1) return;
    onChange(images.filter((_, currentIndex) => currentIndex !== index));
  };
  const moveImage = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const reordered = [...images];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    onChange(reordered);
  };
  const uploadImages = async (files: FileList | null) => {
    if (!files?.length) return;
    const asDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
    const optimizeImage = async (file: File) => {
      if (!file.type.startsWith("image/") || file.type === "image/svg+xml") return asDataUrl(file);
      try {
        const bitmap = await createImageBitmap(file);
        const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(bitmap.width * scale));
        canvas.height = Math.max(1, Math.round(bitmap.height * scale));
        const context = canvas.getContext("2d", { alpha: true });
        if (!context) throw new Error("Canvas indisponível");
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        bitmap.close();
        return canvas.toDataURL("image/webp", .84);
      } catch {
        return asDataUrl(file);
      }
    };
    const uploaded: string[] = [];
    for (const file of Array.from(files)) uploaded.push(await optimizeImage(file));
    onChange([...images, ...uploaded]);
  };

  return <section className="editor-gallery"><div className="editor-gallery-heading"><div><h3>Galeria de imagens</h3><p>A primeira imagem é a capa do produto. Novos uploads são otimizados automaticamente.</p></div><label className="upload-gallery-button">Enviar imagens<input type="file" accept="image/*" multiple onChange={(event) => { void uploadImages(event.target.files); event.currentTarget.value = ""; }} /></label></div><div className="gallery-editor-list">{images.map((image, index) => <div className="gallery-editor-row" key={`${image}-${index}`}><span className="gallery-position">{index + 1}</span><img src={image || "/vassoura-multiuso-magica.webp"} alt="Prévia da imagem" loading="lazy" decoding="async" /><label>Endereço da imagem<input value={image} onChange={(event) => updateImage(index, event.target.value)} placeholder="https://..." /></label><div className="gallery-row-actions"><button type="button" onClick={() => moveImage(index, -1)} disabled={index === 0} aria-label="Mover imagem para cima">↑</button><button type="button" onClick={() => moveImage(index, 1)} disabled={index === images.length - 1} aria-label="Mover imagem para baixo">↓</button><button type="button" className="remove-gallery-image" onClick={() => removeImage(index)} disabled={images.length === 1}>Remover</button></div>{index === 0 && <small className="cover-tag">Capa</small>}</div>)}</div><div className="add-image-url"><input value={newImageUrl} onChange={(event) => setNewImageUrl(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addImageUrl(); } }} placeholder="Cole o endereço de outra imagem" /><button type="button" className="outline-button" onClick={addImageUrl}>+ Adicionar URL</button></div></section>;
}

async function optimizeReviewImage(file: File, maxSize = 900) {
  const asDataUrl = () => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") return asDataUrl();
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) throw new Error("Canvas indisponível");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return canvas.toDataURL("image/webp", .8);
  } catch {
    return asDataUrl();
  }
}

function ProductReviewsEditor({ productId, reviews, onChange }: { productId: number; reviews: Review[]; onChange: (reviews: Review[]) => void }) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const update = (id: number, patch: Partial<Review>) => onChange(reviews.map((review) => review.id === id ? { ...review, ...patch } : review));
  const addReview = () => {
    const id = Date.now();
    onChange([...reviews, { id, productId, name: "", rating: 5, comment: "", date: new Date().toISOString().slice(0, 10), purchaseDate: new Date().toISOString().slice(0, 10), approved: true, media: [] }]);
    setExpandedId(id);
    setMessage("");
  };
  const importReviews = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    const imported = reviewsFromImport(await file.text(), productId).filter((review) => review.productId === productId).map((review) => ({ ...review, purchaseDate: review.purchaseDate || review.date, media: review.media || [] }));
    if (!imported.length) { setMessage("Nenhuma avaliação válida foi encontrada nesse arquivo."); return; }
    onChange([...reviews, ...imported]);
    setMessage(`${imported.length} avaliações importadas para este produto.`);
  };
  const uploadAvatar = async (review: Review, files: FileList | null) => {
    const file = files?.[0];
    if (file) update(review.id, { avatar: await optimizeReviewImage(file, 320) });
  };
  const uploadMedia = async (review: Review, files: FileList | null) => {
    if (!files?.length) return;
    const uploaded: string[] = [];
    for (const file of Array.from(files).slice(0, 6)) uploaded.push(await optimizeReviewImage(file));
    update(review.id, { media: [...(review.media || []), ...uploaded].slice(0, 6) });
  };

  return <section className="editor-reviews-settings"><div className="editor-reviews-heading"><div><span><i className="bi bi-chat-square-heart" /></span><div><h3>Avaliações deste produto</h3><p>Gerencie depoimentos, fotos e informações de compra exibidas somente neste item.</p></div></div><div className="editor-review-heading-actions"><label className="outline-button review-import-button">Importar em massa<input type="file" accept=".csv,.json,text/csv,application/json" onChange={(event) => { void importReviews(event.target.files); event.currentTarget.value = ""; }} /></label><button type="button" className="primary-button" onClick={addReview}>+ Nova avaliação</button></div></div>{message && <p className="review-message">{message}</p>}<details className="import-help"><summary>Formato da importação</summary><p>CSV ou JSON com os campos: <code>nome,nota,comentario,data,aprovado,avatar,mídias</code>. Para várias mídias, separe os endereços com <code>|</code>.</p></details><div className="product-review-editor-list">{reviews.length ? reviews.map((review) => <article className={`product-review-editor-card ${expandedId === review.id ? "expanded" : ""}`} key={review.id}><header><div className="review-admin-person">{review.avatar ? <img src={review.avatar} alt="" /> : <span>{review.name.trim().charAt(0).toUpperCase() || "?"}</span>}<div><b>{review.name || "Nova avaliação"}</b><small>{review.rating} estrelas · {review.approved ? "Publicada" : "Oculta"}</small></div></div><div><button type="button" className="outline-button" onClick={() => setExpandedId(expandedId === review.id ? null : review.id)}>{expandedId === review.id ? "Fechar" : "Editar"}</button><button type="button" className="text-danger" onClick={() => onChange(reviews.filter((item) => item.id !== review.id))}>Excluir</button></div></header>{expandedId === review.id && <div className="product-review-editor-fields"><label>Nome do cliente<input value={review.name} onChange={(event) => update(review.id, { name: event.target.value })} placeholder="Nome completo" /></label><label>Nota<select value={review.rating} onChange={(event) => update(review.id, { rating: Number(event.target.value) })}>{[5, 4, 3, 2, 1].map((rating) => <option value={rating} key={rating}>{rating} estrela{rating > 1 ? "s" : ""}</option>)}</select></label><label>Data da compra<input type="date" value={review.purchaseDate || review.date} onChange={(event) => update(review.id, { purchaseDate: event.target.value, date: event.target.value })} /></label><label className="review-publish-toggle"><input type="checkbox" checked={review.approved} onChange={(event) => update(review.id, { approved: event.target.checked })} /><span><b>Publicar avaliação</b><small>Visível na página do produto</small></span></label><label className="wide">Comentário do cliente<textarea value={review.comment} onChange={(event) => update(review.id, { comment: event.target.value })} placeholder="Conte como foi a experiência do cliente" /></label><div className="review-avatar-editor"><b>Foto do avatar</b><div>{review.avatar ? <img src={review.avatar} alt="Prévia do avatar" /> : <span><i className="bi bi-person" /></span>}<label className="outline-button">Escolher foto<input type="file" accept="image/*" onChange={(event) => { void uploadAvatar(review, event.target.files); event.currentTarget.value = ""; }} /></label>{review.avatar && <button type="button" className="text-danger" onClick={() => update(review.id, { avatar: "" })}>Remover</button>}</div></div><div className="review-media-editor"><div><b>Mídias da avaliação</b><small>Até 6 fotos por avaliação</small></div><div className="review-media-grid">{review.media?.map((media, index) => <figure key={`${review.id}-media-${index}`}><img src={media} alt="Mídia da avaliação" /><button type="button" onClick={() => update(review.id, { media: review.media?.filter((_, mediaIndex) => mediaIndex !== index) })} aria-label="Remover mídia">×</button></figure>)}{(review.media?.length || 0) < 6 && <label className="review-media-upload"><i className="bi bi-images" /><span>Adicionar fotos</span><input type="file" accept="image/*" multiple onChange={(event) => { void uploadMedia(review, event.target.files); event.currentTarget.value = ""; }} /></label>}</div></div></div>}</article>) : <div className="review-empty"><i className="bi bi-chat-square-text" /><b>Nenhuma avaliação cadastrada</b><p>Adicione a primeira avaliação deste produto.</p></div>}</div></section>;
}

function ProductEditor({ product, reviews, onCancel, onSave }: { product: Product; reviews: Review[]; onCancel: () => void; onSave: (product: Product, reviews: Review[]) => void }) {
  const defaults = checkoutText(product);
  const [draft, setDraft] = useState<Product>({ ...product, gallery: product.gallery?.length ? product.gallery : [product.image], checkoutTitle: defaults.title, checkoutBadge: defaults.badge, checkoutGuarantee: defaults.guarantee, checkoutDelivery: defaults.delivery, pixCode: defaults.pixCode });
  const [draftReviews, setDraftReviews] = useState<Review[]>(reviews.filter((review) => review.productId === product.id));
  const set = (key: keyof Product, value: string | number | boolean) => setDraft({ ...draft, [key]: value });
  const galleryImages = draft.gallery?.filter(Boolean).length ? draft.gallery.filter(Boolean) : [draft.image];
  const updateGallery = (gallery: string[]) => setDraft((current) => ({ ...current, gallery, image: gallery[0] || current.image }));
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onCancel(); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [onCancel]);
  return <div className="product-editor-screen" role="dialog" aria-modal="true" aria-label="Editar produto e checkout"><div className="editor-modal"><div className="modal-heading"><div><span className="muted">Catálogo / Produto</span><h2>Editar produto e checkout</h2></div><button type="button" onClick={onCancel} aria-label="Fechar editor">×</button></div><div className="editor-form">
    <label>Nome do produto<input value={draft.name} onChange={(event) => set("name", event.target.value)} /></label>
    <label>Categoria<select value={draft.category} onChange={(event) => set("category", event.target.value)}><option>Cozinha</option><option>Home page</option><option>Eletroportáteis</option><option>Utilitários Domésticos</option><option>Eletrônicos</option><option>Gadgets</option><option>Ferramentas</option></select></label>
    <label>Preço<input type="number" step="0.01" value={draft.price} onChange={(event) => set("price", Number(event.target.value))} /></label>
    <label>Preço anterior<input type="number" step="0.01" value={draft.oldPrice} onChange={(event) => set("oldPrice", Number(event.target.value))} /></label>
    <label>Valor no Pix<input type="number" step="0.01" value={draft.pix} onChange={(event) => set("pix", Number(event.target.value))} /></label>
    <label>Estoque<input type="number" value={draft.stock} onChange={(event) => set("stock", Number(event.target.value))} /></label>
    <label className="editor-description-field">Descrição<textarea value={draft.description} onChange={(event) => set("description", event.target.value)} /></label>
    <section className="editor-checkout-settings"><div className="editor-checkout-heading"><span><i className="bi bi-credit-card-2-front" /></span><div><h3>Checkout individual deste produto</h3><p>Essas informações aparecem somente no checkout deste item.</p></div></div><div className="editor-checkout-grid">
      <label>Título no checkout<input value={draft.checkoutTitle ?? ""} onChange={(event) => set("checkoutTitle", event.target.value)} /></label>
      <label>Selo da oferta<input value={draft.checkoutBadge ?? ""} onChange={(event) => set("checkoutBadge", event.target.value)} /></label>
      <label className="wide">Texto de garantia<textarea value={draft.checkoutGuarantee ?? ""} onChange={(event) => set("checkoutGuarantee", event.target.value)} /></label>
      <label className="wide">Prazo e mensagem de entrega<input value={draft.checkoutDelivery ?? ""} onChange={(event) => set("checkoutDelivery", event.target.value)} /></label>
      <label className="wide pix-code-editor">Código Pix Copia e Cola<textarea value={draft.pixCode ?? ""} onChange={(event) => set("pixCode", event.target.value)} placeholder="Cole aqui o código Pix válido deste produto" /><small>O cliente verá e copiará exatamente este código após preencher o formulário.</small></label>
    </div></section>
    <section className="editor-tracking-settings"><div className="editor-tracking-heading"><span><i className="bi bi-bullseye" /></span><div><h3>Pixels, Analytics e APIs de conversão</h3><p>Ative a medição somente para este produto e para o checkout correspondente.</p></div><em>POR PRODUTO</em></div><div className="tracking-provider-grid">
      <article className="tracking-provider meta-provider"><header><span><i className="bi bi-facebook" /></span><div><h4>Meta / Facebook</h4><p>Pixel + Conversions API</p></div><em className={draft.metaPixelId && (draft.metaPixelEnabled || draft.metaConversionsApiEnabled) ? "active" : ""}>{draft.metaPixelId && (draft.metaPixelEnabled || draft.metaConversionsApiEnabled) ? "Configurado" : "Inativo"}</em></header><label>ID do Pixel Meta<input value={draft.metaPixelId ?? ""} onChange={(event) => set("metaPixelId", event.target.value.replace(/\D/g, ""))} placeholder="Ex.: 123456789012345" inputMode="numeric" /></label><div className="tracking-toggles"><label><input type="checkbox" checked={Boolean(draft.metaPixelEnabled)} onChange={(event) => set("metaPixelEnabled", event.target.checked)} /><span><b>Pixel no navegador</b><small>ViewContent e etapas do checkout</small></span></label><label><input type="checkbox" checked={Boolean(draft.metaConversionsApiEnabled)} onChange={(event) => set("metaConversionsApiEnabled", event.target.checked)} /><span><b>Conversions API</b><small>Envio protegido pelo servidor</small></span></label></div><div className="tracking-kv-hint"><i className="bi bi-key" /><span>Chave no KV<b>{draft.metaPixelId ? `izzat:tracking:meta:${draft.metaPixelId}` : "Preencha o ID para ver a chave"}</b></span></div></article>
      <article className="tracking-provider tiktok-provider">
        <header><span><i className="bi bi-tiktok" /></span><div><h4>TikTok</h4><p>Pixel + Events API + Advanced Matching</p></div><em className={draft.tiktokPixelId && (draft.tiktokPixelEnabled || draft.tiktokEventsApiEnabled) ? "active" : ""}>{draft.tiktokPixelId && (draft.tiktokPixelEnabled || draft.tiktokEventsApiEnabled) ? "Configurado" : "Inativo"}</em></header>
        <label>ID do Pixel TikTok<input value={draft.tiktokPixelId ?? ""} onChange={(event) => set("tiktokPixelId", event.target.value.replace(/[^a-z0-9_-]/gi, "").toUpperCase())} placeholder="Ex.: CXXXXXXXXXXXXXXXXX" autoComplete="off" /></label>
        <div className="tracking-toggles"><label><input type="checkbox" checked={Boolean(draft.tiktokPixelEnabled)} onChange={(event) => set("tiktokPixelEnabled", event.target.checked)} /><span><b>Pixel no navegador</b><small>Funil SPA + correspondência manual</small></span></label><label><input type="checkbox" checked={Boolean(draft.tiktokEventsApiEnabled)} onChange={(event) => set("tiktokEventsApiEnabled", event.target.checked)} /><span><b>Events API</b><small>Envio protegido e deduplicado</small></span></label></div>
        <div className="tracking-match-list" aria-label="Cobertura de correspondência do TikTok"><span><i className="bi bi-check2" /> ttclid e _ttp</span><span><i className="bi bi-check2" /> E-mail e telefone SHA-256</span><span><i className="bi bi-check2" /> External ID, IP e navegador</span><span><i className="bi bi-check2" /> Event ID anti-duplicidade</span></div>
        <div className="tracking-kv-hint"><i className="bi bi-key" /><span>Chave no KV<b>{draft.tiktokPixelId ? `izzat:tracking:tiktok:${draft.tiktokPixelId}` : "Preencha o ID para ver a chave"}</b></span></div>
        <p className="tracking-provider-note">Para cobertura máxima, ative também Correspondência Avançada Automática e cookies próprios nas configurações do Pixel no TikTok Events Manager.</p>
      </article>
      <article className="tracking-provider google-provider"><header><span><i className="bi bi-google" /></span><div><h4>Google Analytics 4</h4><p>Google tag + Measurement Protocol</p></div><em className={draft.googleAnalyticsId && (draft.googleAnalyticsEnabled || draft.googleMeasurementProtocolEnabled) ? "active" : ""}>{draft.googleAnalyticsId && (draft.googleAnalyticsEnabled || draft.googleMeasurementProtocolEnabled) ? "Configurado" : "Inativo"}</em></header><label>ID de medição GA4<input value={draft.googleAnalyticsId ?? ""} onChange={(event) => set("googleAnalyticsId", event.target.value.replace(/[^a-z0-9-]/gi, "").toUpperCase())} placeholder="Ex.: G-XXXXXXXXXX" autoCapitalize="characters" autoComplete="off" /></label><div className="tracking-toggles"><label><input type="checkbox" checked={Boolean(draft.googleAnalyticsEnabled)} onChange={(event) => set("googleAnalyticsEnabled", event.target.checked)} /><span><b>Google tag no navegador</b><small>Funil GA4 adaptado ao checkout SPA</small></span></label><label><input type="checkbox" checked={Boolean(draft.googleMeasurementProtocolEnabled)} onChange={(event) => set("googleMeasurementProtocolEnabled", event.target.checked)} /><span><b>Measurement Protocol</b><small>Complementa o evento de geração do Pix</small></span></label></div><div className="tracking-kv-hint"><i className="bi bi-key" /><span>Chave no KV<b>{draft.googleAnalyticsId ? `izzat:tracking:google:${draft.googleAnalyticsId}` : "Preencha o ID para ver a chave"}</b></span></div><p className="tracking-provider-note">Com as duas opções ativas, o funil roda no navegador e a geração do Pix é enviada pelo servidor, sem duplicidade.</p></article>
    </div><div className="tracking-security-note"><i className="bi bi-shield-lock" /><div><b>Segredos nunca ficam expostos no site</b><p>Os IDs públicos ficam neste produto. Tokens e API Secrets permanecem exclusivamente no Cloudflare KV.</p></div></div></section>
    <GalleryEditor images={galleryImages} onChange={updateGallery} />
    <ProductReviewsEditor productId={product.id} reviews={draftReviews} onChange={setDraftReviews} />
  </div><div className="modal-actions"><button className="outline-button" onClick={onCancel}>Cancelar</button><button className="primary-button" onClick={() => onSave({ ...draft, image: galleryImages[0] || draft.image, gallery: galleryImages }, draftReviews)}>Salvar produto, checkout e avaliações</button></div></div></div>;
}

export default AdminPanel;
