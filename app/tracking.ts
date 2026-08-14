"use client";

export type TrackingProduct = {
  id: number;
  name: string;
  category: string;
  price: number;
  pix: number;
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

export type TrackingEventName = "ViewContent" | "InitiateCheckout" | "AddPaymentInfo" | "CompletePayment";

export type CheckoutUxEventName =
  | "CheckoutDataCompleted"
  | "CheckoutDeliveryCompleted"
  | "CheckoutValidationError"
  | "CheckoutCtaClick"
  | "PixDisplayed"
  | "PixCopied";

type AnyTrackingEventName = TrackingEventName | CheckoutUxEventName;

type TrackingCustomer = {
  email?: string;
  phone?: string;
};

type TrackingEventOptions = {
  eventId?: string;
  orderId?: string;
  customer?: TrackingCustomer;
  context?: {
    field?: string;
    errorCount?: number;
  };
};

type MetaPixel = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[][];
  loaded?: boolean;
  version?: string;
};

type TikTokQueue = unknown[] & {
  _u?: string;
  _i?: Record<string, TikTokQueue>;
  _t?: Record<string, number>;
  _o?: Record<string, Record<string, unknown>>;
  methods?: string[];
  setAndDefer?: (target: TikTokQueue, method: string) => void;
  instance?: (pixelId: string) => TikTokQueue;
  load?: (pixelId: string, options?: Record<string, unknown>) => void;
  identify?: (identity: Record<string, string>) => void;
  page?: () => void;
  track?: (...args: unknown[]) => void;
};

type TrackingWindow = Window & {
  fbq?: MetaPixel;
  _fbq?: MetaPixel;
  TiktokAnalyticsObject?: string;
  ttq?: TikTokQueue;
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
};

const initializedMetaPixels = new Set<string>();
const initializedTikTokPixels = new Set<string>();
const initializedGoogleMeasurementIds = new Set<string>();
let memoryTikTokExternalId = "";

export function createTrackingEventId(event: AnyTrackingEventName, productId: number) {
  const random = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `izzat-${productId}-${event.toLowerCase()}-${random}`;
}

function randomBrowserId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function tiktokExternalId() {
  const storageKey = "izzat_tiktok_external_id";
  try {
    const existing = window.localStorage.getItem(storageKey);
    if (existing) return existing;
    const generated = randomBrowserId();
    window.localStorage.setItem(storageKey, generated);
    return generated;
  } catch {
    memoryTikTokExternalId ||= randomBrowserId();
    return memoryTikTokExternalId;
  }
}

async function browserSha256(value: string) {
  if (!value || typeof crypto === "undefined" || !crypto.subtle) return "";
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function normalizedTikTokPhone(value?: string) {
  const digits = value?.replace(/\D/g, "") || "";
  if (!digits) return "";
  return `+${digits.startsWith("55") ? digits : `55${digits}`}`;
}

async function tiktokBrowserIdentity(customer?: TrackingCustomer) {
  try {
    const email = customer?.email?.trim().toLowerCase() || "";
    const phone = normalizedTikTokPhone(customer?.phone);
    const [externalIdHash, emailHash, phoneHash] = await Promise.all([
      browserSha256(tiktokExternalId()),
      email ? browserSha256(email) : Promise.resolve(""),
      phone ? browserSha256(phone) : Promise.resolve(""),
    ]);
    return {
      ...(externalIdHash ? { external_id: externalIdHash } : {}),
      ...(emailHash ? { email: emailHash } : {}),
      ...(phoneHash ? { phone_number: phoneHash } : {}),
    };
  } catch {
    return {};
  }
}

function loadMetaPixel(pixelId: string) {
  if (!pixelId || initializedMetaPixels.has(pixelId)) return;
  const global = window as TrackingWindow;
  if (!global.fbq) {
    const pixel = ((...args: unknown[]) => {
      if (pixel.callMethod) pixel.callMethod(...args);
      else pixel.queue?.push(args);
    }) as MetaPixel;
    pixel.queue = [];
    pixel.loaded = true;
    pixel.version = "2.0";
    global.fbq = pixel;
    global._fbq = pixel;
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    script.dataset.izzatTracking = "meta";
    document.head.appendChild(script);
  }
  global.fbq?.("init", pixelId);
  initializedMetaPixels.add(pixelId);
}

function createTikTokQueue() {
  const global = window as TrackingWindow;
  if (global.ttq) return global.ttq;
  const queue = [] as TikTokQueue;
  const methods = ["page", "track", "identify", "instances", "debug", "on", "off", "once", "ready", "alias", "group", "enableCookie", "disableCookie", "holdConsent", "revokeConsent", "grantConsent"];
  queue.methods = methods;
  queue._i = {};
  queue._t = {};
  queue._o = {};
  queue.setAndDefer = (target, method) => {
    (target as unknown as Record<string, (...args: unknown[]) => void>)[method] = (...args: unknown[]) => {
      target.push([method, ...args]);
    };
  };
  methods.forEach((method) => queue.setAndDefer?.(queue, method));
  queue.instance = (pixelId) => {
    queue._i ??= {};
    const instance = queue._i[pixelId] ?? ([] as unknown as TikTokQueue);
    methods.forEach((method) => queue.setAndDefer?.(instance, method));
    queue._i[pixelId] = instance;
    return instance;
  };
  queue.load = (pixelId, options = {}) => {
    queue._i ??= {};
    queue._t ??= {};
    queue._o ??= {};
    const instance = queue.instance?.(pixelId);
    if (instance) instance._u = "https://analytics.tiktok.com/i18n/pixel/events.js";
    queue._t[pixelId] = Date.now();
    queue._o[pixelId] = options;
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=${encodeURIComponent(pixelId)}&lib=ttq`;
    script.dataset.izzatTracking = "tiktok";
    document.head.appendChild(script);
  };
  global.TiktokAnalyticsObject = "ttq";
  global.ttq = queue;
  return queue;
}

function loadTikTokPixel(pixelId: string) {
  if (!pixelId || initializedTikTokPixels.has(pixelId)) return;
  createTikTokQueue().load?.(pixelId);
  initializedTikTokPixels.add(pixelId);
}

function loadGoogleAnalytics(measurementId: string) {
  if (!/^G-[A-Z0-9]+$/i.test(measurementId) || initializedGoogleMeasurementIds.has(measurementId)) return;
  const global = window as TrackingWindow;
  global.dataLayer ??= [];
  global.gtag ??= function (..._args: unknown[]) { global.dataLayer?.push(arguments); };
  if (!document.querySelector('script[data-izzat-tracking="google"]')) {
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    script.dataset.izzatTracking = "google";
    document.head.appendChild(script);
    global.gtag("js", new Date());
  }
  global.gtag("config", measurementId, { send_page_view: false });
  initializedGoogleMeasurementIds.add(measurementId);
}

function commerceProperties(product: TrackingProduct, orderId?: string) {
  return {
    content_id: String(product.id),
    content_ids: [String(product.id)],
    content_name: product.name,
    content_category: product.category,
    content_type: "product",
    contents: [{ content_id: String(product.id), content_type: "product", content_name: product.name, quantity: 1, price: product.pix }],
    currency: "BRL",
    value: product.pix,
    ...(orderId ? { order_id: orderId } : {}),
  };
}

function trackMetaBrowser(product: TrackingProduct, event: TrackingEventName, eventId: string, orderId?: string) {
  const pixelId = product.metaPixelId?.trim();
  if (!product.metaPixelEnabled || !pixelId) return;
  loadMetaPixel(pixelId);
  const properties = commerceProperties(product, orderId);
  const global = window as TrackingWindow;
  if (event === "CompletePayment") global.fbq?.("trackSingleCustom", pixelId, "PixGenerated", properties, { eventID: eventId });
  else global.fbq?.("trackSingle", pixelId, event, properties, { eventID: eventId });
}

async function trackTikTokBrowser(product: TrackingProduct, event: TrackingEventName, eventId: string, orderId?: string, customer?: TrackingCustomer) {
  const pixelId = product.tiktokPixelId?.trim();
  if (!product.tiktokPixelEnabled || !pixelId) return;
  loadTikTokPixel(pixelId);
  const instance = (window as TrackingWindow).ttq?.instance?.(pixelId);
  const identity = await tiktokBrowserIdentity(customer);
  if (Object.keys(identity).length) instance?.identify?.(identity);
  if (event === "ViewContent") instance?.page?.();
  instance?.track?.(event, commerceProperties(product, orderId), { event_id: eventId });
}

function googleEventName(event: AnyTrackingEventName) {
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

function trackGoogleBrowser(product: TrackingProduct, event: AnyTrackingEventName, eventId: string, orderId?: string, context?: TrackingEventOptions["context"]) {
  const measurementId = product.googleAnalyticsId?.trim().toUpperCase();
  if (!product.googleAnalyticsEnabled || !measurementId || !/^G-[A-Z0-9]+$/.test(measurementId)) return;
  if (event === "CompletePayment" && product.googleMeasurementProtocolEnabled) return;
  loadGoogleAnalytics(measurementId);
  (window as TrackingWindow).gtag?.("event", googleEventName(event), {
    send_to: measurementId,
    currency: "BRL",
    value: product.pix,
    items: [{ item_id: String(product.id), item_name: product.name, item_category: product.category, price: product.pix, quantity: 1 }],
    event_id: eventId,
    ...(event === "AddPaymentInfo" ? { payment_type: "Pix" } : {}),
    ...(orderId ? { order_id: orderId } : {}),
    ...(context?.field ? { checkout_field: context.field } : {}),
    ...(context?.errorCount ? { error_count: context.errorCount } : {}),
  });
}

function googleClientId() {
  const gaCookie = document.cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith("_ga="));
  const cookieValue = gaCookie?.slice(4).split(".").slice(-2).join(".");
  if (cookieValue) return cookieValue;
  const storageKey = "izzat_ga_client_id";
  try {
    const existing = window.localStorage.getItem(storageKey);
    if (existing) return existing;
    const generated = `${Date.now()}.${Math.floor(Math.random() * 1_000_000_000)}`;
    window.localStorage.setItem(storageKey, generated);
    return generated;
  } catch {
    return `${Date.now()}.${Math.floor(Math.random() * 1_000_000_000)}`;
  }
}

function readCookie(name: string) {
  const prefix = `${name}=`;
  const value = document.cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(prefix));
  if (!value) return "";
  const rawValue = value.slice(prefix.length);
  try {
    return decodeURIComponent(rawValue);
  } catch {
    return rawValue;
  }
}

function tiktokClickId(parameters: URLSearchParams) {
  const fromUrl = parameters.get("ttclid")?.trim().slice(0, 500) || "";
  try {
    if (fromUrl) window.sessionStorage.setItem("izzat_tiktok_ttclid", fromUrl);
    return fromUrl || readCookie("ttclid") || window.sessionStorage.getItem("izzat_tiktok_ttclid") || "";
  } catch {
    return fromUrl || readCookie("ttclid");
  }
}

function currentClickData(product: TrackingProduct) {
  const parameters = new URLSearchParams(window.location.search);
  return {
    url: window.location.href,
    referrer: document.referrer,
    ...(product.metaConversionsApiEnabled ? { fbclid: parameters.get("fbclid") ?? undefined } : {}),
    ...(product.tiktokEventsApiEnabled ? {
      ttclid: tiktokClickId(parameters) || undefined,
      tiktokExternalId: tiktokExternalId(),
    } : {}),
    ...(product.googleMeasurementProtocolEnabled ? { gaClientId: googleClientId() } : {}),
  };
}

async function trackServer(product: TrackingProduct, event: AnyTrackingEventName, eventId: string, options: TrackingEventOptions) {
  const googleServerNeeded = product.googleMeasurementProtocolEnabled && (!product.googleAnalyticsEnabled || event === "CompletePayment");
  const isUxEvent = !(["ViewContent", "InitiateCheckout", "AddPaymentInfo", "CompletePayment"] as AnyTrackingEventName[]).includes(event);
  if (isUxEvent && !googleServerNeeded) return;
  if (!isUxEvent && !product.metaConversionsApiEnabled && !product.tiktokEventsApiEnabled && !googleServerNeeded) return;
  try {
    await fetch("/api/tracking/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        productId: product.id,
        event,
        eventId,
        orderId: options.orderId,
        customer: options.customer,
        context: options.context,
        page: currentClickData(product),
      }),
      keepalive: true,
    });
  } catch {
    // Marketing measurement must never interrupt the storefront or checkout.
  }
}

export function trackProductEvent(product: TrackingProduct, event: TrackingEventName, options: TrackingEventOptions = {}) {
  if (typeof window === "undefined") return "";
  const eventId = options.eventId ?? createTrackingEventId(event, product.id);
  trackMetaBrowser(product, event, eventId, options.orderId);
  void trackTikTokBrowser(product, event, eventId, options.orderId, options.customer);
  trackGoogleBrowser(product, event, eventId, options.orderId, options.context);
  void trackServer(product, event, eventId, options);
  return eventId;
}

export function trackCheckoutUxEvent(product: TrackingProduct, event: CheckoutUxEventName, options: TrackingEventOptions = {}) {
  if (typeof window === "undefined") return "";
  const eventId = options.eventId ?? createTrackingEventId(event, product.id);
  const detail = {
    event,
    eventId,
    productId: product.id,
    orderId: options.orderId,
    context: options.context,
  };
  window.dispatchEvent(new CustomEvent("izzat:checkout-analytics", { detail }));
  trackGoogleBrowser(product, event, eventId, options.orderId, options.context);
  const googleServerNeeded = product.googleMeasurementProtocolEnabled && !product.googleAnalyticsEnabled;
  if (googleServerNeeded) void trackServer(product, event, eventId, options);
  return eventId;
}
