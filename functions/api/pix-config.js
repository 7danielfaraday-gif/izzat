// Cloudflare Pages Function: GET /api/pix-config
// Public endpoint for the checkout to read the PIX config of the active product.

import { json } from '../_shared/responses.js';
import { getProductBySlug, getStore } from '../_shared/store.js';

export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const slug = url.searchParams.get('slug') || url.searchParams.get('product') || '';
    const store = await getStore(context.env);
    const product = getProductBySlug(store, slug);

    if (!product || !product.active) {
      return json({ ok: false, error: 'product_not_found' }, 404, context.request);
    }

    return json({
      ok: true,
      slug: product.slug,
      pix_code: product.pix && product.pix.pix_code ? product.pix.pix_code : '',
      qrcode_url: product.pix ? product.pix.qrcode_url : null,
      updated_at: product.updated_at || null,
    }, 200, context.request);
  } catch (error) {
    console.error('[pix-config] GET error', error);
    return json({ ok: false, error: 'server_error' }, 500, context.request);
  }
}

export async function onRequestPost() {
  // Updates are handled by /api/pix-config-admin (protected).
  return json({ ok: false, error: 'method_not_allowed' }, 405);
}
