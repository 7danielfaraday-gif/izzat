import { checkBasicAuth, unauthorized } from '../_shared/auth.js';
import { badRequest, json } from '../_shared/responses.js';
import { getStore, normalizeStore, saveStore, sanitizeAdminStore } from '../_shared/store.js';

export async function onRequestGet(context) {
  try {
    if (!checkBasicAuth(context.request, context.env)) return unauthorized('Izzat Admin');

    const store = await getStore(context.env);
    return json({ ok: true, store: sanitizeAdminStore(store) });
  } catch (error) {
    console.error('[store-admin] GET error', error);
    return json({ ok: false, error: 'server_error' }, 500);
  }
}

export async function onRequestPost(context) {
  try {
    if (!checkBasicAuth(context.request, context.env)) return unauthorized('Izzat Admin');

    let body = null;
    try {
      body = await context.request.json();
    } catch {
      return badRequest('invalid_json');
    }

    if (!body || typeof body !== 'object') return badRequest('invalid_body');
    if (!Array.isArray(body.products) || !body.products.length) return badRequest('products_required');

    const normalized = normalizeStore({
      default_product_slug: typeof body.default_product_slug === 'string' ? body.default_product_slug : '',
      products: body.products,
      updated_at: new Date().toISOString(),
    });

    const saved = await saveStore(context.env, normalized);
    return json({ ok: true, store: sanitizeAdminStore(saved) });
  } catch (error) {
    console.error('[store-admin] POST error', error);
    return json({ ok: false, error: 'server_error' }, 500);
  }
}
