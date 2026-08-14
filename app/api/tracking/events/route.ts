import { readStore } from "../../../store-kv";
import { cookiesFrom, normalizedEmail, normalizedPhone, normalizedTikTokPhone, readGoogleTrackingSecret, readTrackingSecret, sha256 } from "../../../tracking-server";

type TrackingEventName =
  | "ViewContent"
  | "InitiateCheckout"
  | "AddPaymentInfo"
  | "CompletePayment"
  | "CheckoutDataCompleted"
  | "CheckoutDeliveryCompleted"
  | "CheckoutValidationError"
  | "CheckoutCtaClick"
  | "PixDisplayed"
  | "PixCopied";

type TrackedProduct = {
  id: number;
  name: string;
  category: string;
  price: number;
  pix: number;
  metaPixelId?: string;
  metaConversionsApiEnabled?: boolean;
  tiktokPixelId?: string;
  tiktokEventsApiEnabled?: boolean;
  googleAnalyticsId?: string;
  googleAnalyticsEnabled?: boolean;
  googleMeasurementProtocolEnabled?: boolean;
};

type TrackingRequest = {
  productId?: number;
  event?: TrackingEventName;
  eventId?: string;
  orderId?: string;
  customer?: { email?: string; phone?: string };
  context?: { field?: string; errorCount?: number };
  page?: { url?: string; referrer?: string; fbclid?: string; ttclid?: string; tiktokExternalId?: string; gaClientId?: string };
};

const standardCommerceEvents = new Set<TrackingEventName>(["ViewContent", "InitiateCheckout", "AddPaymentInfo", "CompletePayment"]);
const allowedEvents = new Set<TrackingEventName>([
  ...standardCommerceEvents,
  "CheckoutDataCompleted",
  "CheckoutDeliveryCompleted",
  "CheckoutValidationError",
  "CheckoutCtaClick",
  "PixDisplayed",
  "PixCopied",
]);

function safeText(value: unknown, limit = 300) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

function clientIp(request: Request) {
  return request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
}

function commerceData(product: TrackedProduct, orderId: string) {
  return {
    currency: "BRL",
    value: product.pix,
    content_ids: [String(product.id)],
    content_type: "product",
    contents: [{ id: String(product.id), content_id: String(product.id), content_type: "product", content_name: product.name, quantity: 1, item_price: product.pix, price: product.pix }],
    ...(orderId ? { order_id: orderId } : {}),
  };
}

async function sendMetaEvent(request: Request, product: TrackedProduct, payload: TrackingRequest, pageUrl: string) {
  if (!payload.event || !standardCommerceEvents.has(payload.event)) return "ux_event_skipped";
  const pixelId = safeText(product.metaPixelId, 80);
  if (!product.metaConversionsApiEnabled || !pixelId) return "disabled";
  const secret = await readTrackingSecret("meta", pixelId);
  if (!secret) return "missing_secret";

  const cookies = cookiesFrom(request);
  const email = normalizedEmail(payload.customer?.email);
  const phone = normalizedPhone(payload.customer?.phone);
  const fbclid = safeText(payload.page?.fbclid, 500);
  const userData: Record<string, unknown> = {
    client_ip_address: clientIp(request),
    client_user_agent: request.headers.get("user-agent") || "",
    ...(cookies._fbp ? { fbp: cookies._fbp } : {}),
    ...(cookies._fbc ? { fbc: cookies._fbc } : fbclid ? { fbc: `fb.1.${Date.now()}.${fbclid}` } : {}),
    ...(email ? { em: [await sha256(email)] } : {}),
    ...(phone ? { ph: [await sha256(phone)] } : {}),
  };
  const eventName = payload.event === "CompletePayment" ? "PixGenerated" : payload.event;
  const body: Record<string, unknown> = {
    data: [{
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      event_id: payload.eventId,
      action_source: "website",
      event_source_url: pageUrl,
      user_data: userData,
      custom_data: commerceData(product, safeText(payload.orderId, 120)),
    }],
  };
  if (secret.testEventCode) body.test_event_code = secret.testEventCode;
  const apiVersion = /^v\d+\.\d+$/.test(secret.apiVersion || "") ? secret.apiVersion : "v23.0";
  const response = await fetch(`https://graph.facebook.com/${apiVersion}/${encodeURIComponent(pixelId)}/events?access_token=${encodeURIComponent(secret.accessToken)}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`META_${response.status}`);
  return "sent";
}

async function sendTikTokEvent(request: Request, product: TrackedProduct, payload: TrackingRequest, pageUrl: string, referrer: string) {
  if (!payload.event || !standardCommerceEvents.has(payload.event)) return "ux_event_skipped";
  const pixelId = safeText(product.tiktokPixelId, 120);
  if (!product.tiktokEventsApiEnabled || !pixelId) return "disabled";
  const secret = await readTrackingSecret("tiktok", pixelId);
  if (!secret) return "missing_secret";

  const cookies = cookiesFrom(request);
  const email = normalizedEmail(payload.customer?.email);
  const phone = normalizedTikTokPhone(payload.customer?.phone);
  const externalId = safeText(payload.page?.tiktokExternalId, 180);
  const ttclid = safeText(payload.page?.ttclid, 500) || safeText(cookies.ttclid, 500);
  const user: Record<string, unknown> = {
    ip: clientIp(request),
    user_agent: request.headers.get("user-agent") || "",
    ...(cookies._ttp ? { ttp: cookies._ttp } : {}),
    ...(ttclid ? { ttclid } : {}),
    ...(email ? { email: [await sha256(email)] } : {}),
    ...(phone ? { phone: [await sha256(phone)] } : {}),
    ...(externalId ? { external_id: [await sha256(externalId)] } : {}),
  };
  const productData = commerceData(product, safeText(payload.orderId, 120));
  const body: Record<string, unknown> = {
    event_source: "web",
    event_source_id: pixelId,
    data: [{
      event: payload.event,
      event_time: Math.floor(Date.now() / 1000),
      event_id: payload.eventId,
      user,
      page: { url: pageUrl, referrer },
      properties: {
        ...productData,
        content_id: String(product.id),
        content_name: product.name,
        content_category: product.category,
        quantity: 1,
      },
    }],
  };
  if (secret.testEventCode) body.test_event_code = secret.testEventCode;
  const response = await fetch("https://business-api.tiktok.com/open_api/v1.3/event/track/", {
    method: "POST",
    headers: { "content-type": "application/json", "Access-Token": secret.accessToken },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`TIKTOK_${response.status}`);
  const result = await response.json().catch(() => null) as { code?: number } | null;
  if (result?.code && result.code !== 0) throw new Error(`TIKTOK_${result.code}`);
  return "sent";
}

function googleEventName(event: TrackingEventName) {
  if (event === "ViewContent") return "view_item";
  if (event === "InitiateCheckout") return "begin_checkout";
  if (event === "AddPaymentInfo") return "add_payment_info";
  if (event === "CompletePayment") return "pix_generated";
  if (event === "CheckoutDataCompleted") return "checkout_data_completed";
  if (event === "CheckoutDeliveryCompleted") return "checkout_delivery_completed";
  if (event === "CheckoutValidationError") return "checkout_validation_error";
  if (event === "CheckoutCtaClick") return "checkout_cta_click";
  if (event === "PixDisplayed") return "pix_displayed";
  return "pix_code_copied";
}

async function sendGoogleEvent(product: TrackedProduct, payload: TrackingRequest, pageUrl: string, referrer: string) {
  const measurementId = safeText(product.googleAnalyticsId, 32).toUpperCase();
  if (!product.googleMeasurementProtocolEnabled || !/^G-[A-Z0-9]+$/.test(measurementId)) return "disabled";
  if (product.googleAnalyticsEnabled && payload.event !== "CompletePayment") return "browser_primary";
  const secret = await readGoogleTrackingSecret(measurementId);
  if (!secret) return "missing_secret";
  const clientId = safeText(payload.page?.gaClientId, 100) || `${Date.now()}.${Math.floor(Math.random() * 1_000_000_000)}`;
  const response = await fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(secret.apiSecret)}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      events: [{
        name: googleEventName(payload.event as TrackingEventName),
        params: {
          currency: "BRL",
          value: product.pix,
          page_location: pageUrl,
          ...(referrer ? { page_referrer: referrer } : {}),
          engagement_time_msec: 1,
          event_id: safeText(payload.eventId, 180),
          ...(payload.event === "AddPaymentInfo" ? { payment_type: "Pix" } : {}),
          ...(safeText(payload.orderId, 120) ? { order_id: safeText(payload.orderId, 120) } : {}),
          ...(safeText(payload.context?.field, 40) ? { checkout_field: safeText(payload.context?.field, 40) } : {}),
          ...(Number.isInteger(payload.context?.errorCount) ? { error_count: Math.min(20, Math.max(1, Number(payload.context?.errorCount))) } : {}),
          items: [{ item_id: String(product.id), item_name: product.name, item_category: product.category, price: product.pix, quantity: 1 }],
        },
      }],
    }),
  });
  if (!response.ok) throw new Error(`GOOGLE_${response.status}`);
  return "sent";
}

export async function POST(request: Request) {
  let payload: TrackingRequest;
  try {
    payload = await request.json() as TrackingRequest;
  } catch {
    return Response.json({ error: "Evento inválido" }, { status: 400 });
  }
  if (!Number.isInteger(payload.productId) || !payload.event || !allowedEvents.has(payload.event) || !safeText(payload.eventId, 180)) {
    return Response.json({ error: "Evento inválido" }, { status: 400 });
  }

  const store = await readStore();
  const product = store?.products.find((item) => Boolean(item && typeof item === "object" && (item as { id?: unknown }).id === payload.productId)) as TrackedProduct | undefined;
  if (!product) return Response.json({ error: "Produto não encontrado" }, { status: 404 });

  const requestUrl = new URL(request.url);
  const suppliedUrl = safeText(payload.page?.url, 2048);
  const pageUrl = /^https?:\/\//i.test(suppliedUrl) ? suppliedUrl : `${requestUrl.protocol}//${requestUrl.host}/`;
  const referrer = safeText(payload.page?.referrer, 2048);
  const results = await Promise.allSettled([
    sendMetaEvent(request, product, payload, pageUrl),
    sendTikTokEvent(request, product, payload, pageUrl, referrer),
    sendGoogleEvent(product, payload, pageUrl, referrer),
  ]);
  return Response.json({
    accepted: true,
    meta: results[0].status === "fulfilled" ? results[0].value : "failed",
    tiktok: results[1].status === "fulfilled" ? results[1].value : "failed",
    google: results[2].status === "fulfilled" ? results[2].value : "failed",
  }, { status: 202, headers: { "Cache-Control": "no-store" } });
}
