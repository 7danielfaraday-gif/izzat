import { json } from '../_shared/responses.js';
import { getProductBySlug, getStore, sanitizePublicProduct } from '../_shared/store.js';

export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const slug = url.searchParams.get('slug') || url.searchParams.get('product') || '';
    const store = await getStore(context.env);
    const product = getProductBySlug(store, slug);

    if (!product || !product.active) {
      return json({ ok: false, error: 'product_not_found' }, 404, context.request);
    }

    return json({ ok: true, product: sanitizePublicProduct(product) }, 200, context.request);
  } catch (error) {
    console.error('[product-config] GET error', error);
    return json({ ok: false, error: 'server_error' }, 500, context.request);
  }
}
