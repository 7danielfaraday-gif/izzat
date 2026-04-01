// Cloudflare Pages Function: GET/POST /api/pix-config-admin
// Legacy protected endpoint for reading/updating the PIX config of a specific product.

import { checkBasicAuth, unauthorized } from '../_shared/auth.js';
import { badRequest, json } from '../_shared/responses.js';
import { getProductBySlug, getStore, saveStore } from '../_shared/store.js';

export async function onRequestGet(context) {
  try {
    if (!checkBasicAuth(context.request, context.env)) return unauthorized();

    const url = new URL(context.request.url);
    const slug = url.searchParams.get('slug') || url.searchParams.get('product') || '';
    const store = await getStore(context.env);
    const product = getProductBySlug(store, slug);

    if (!product || !product.active) return json({ ok: false, error: 'product_not_found' }, 404);

    return json({
      ok: true,
      slug: product.slug,
      pix_code: product.pix && product.pix.pix_code ? product.pix.pix_code : '',
      qrcode_url: product.pix ? product.pix.qrcode_url : null,
      updated_at: product.updated_at || null,
    });
  } catch (error) {
    console.error('[pix-config-admin] GET error', error);
    return json({ ok: false, error: 'server_error' }, 500);
  }
}

export async function onRequestPost(context) {
  try {
    if (!checkBasicAuth(context.request, context.env)) return unauthorized();

    let body;
    try {
      body = await context.request.json();
    } catch {
      return badRequest('invalid_json');
    }

    const pix_code = typeof body.pix_code === 'string' ? body.pix_code.trim() : '';
    const qrcode_url =
      body.qrcode_url === null
        ? null
        : typeof body.qrcode_url === 'string'
          ? body.qrcode_url.trim()
          : undefined;

    if (!pix_code || pix_code.length < 20) return badRequest('pix_code_invalid');
    if (qrcode_url !== undefined && qrcode_url !== null && qrcode_url.length < 3) return badRequest('qrcode_url_invalid');

    const store = await getStore(context.env);
    const slug = typeof body.slug === 'string' ? body.slug.trim().toLowerCase() : '';
    const target = getProductBySlug(store, slug);
    if (!target || !target.active) return badRequest('product_not_found');

    const products = store.products.map((product) => {
      if (product.slug !== target.slug) return product;
      return {
        ...product,
        pix: {
          pix_code,
          qrcode_url: qrcode_url === undefined ? '/assets/img/qrcode.webp' : qrcode_url,
        },
        updated_at: new Date().toISOString(),
      };
    });

    const saved = await saveStore(context.env, {
      ...store,
      products,
    });

    const updated = getProductBySlug(saved, target.slug);
    return json({
      ok: true,
      slug: updated.slug,
      pix_code: updated.pix && updated.pix.pix_code ? updated.pix.pix_code : '',
      qrcode_url: updated.pix ? updated.pix.qrcode_url : null,
      updated_at: updated.updated_at || null,
    });
  } catch (error) {
    console.error('[pix-config-admin] POST error', error);
    return json({ ok: false, error: 'server_error' }, 500);
  }
}
