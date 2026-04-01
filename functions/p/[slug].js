function buildAssetRequest(request, targetPath) {
  const incomingUrl = new URL(request.url);
  const assetUrl = new URL(targetPath, incomingUrl.origin);

  incomingUrl.searchParams.forEach((value, key) => {
    assetUrl.searchParams.set(key, value);
  });

  return new Request(assetUrl.toString(), request);
}

export async function onRequest(context) {
  try {
    if (context.env && context.env.ASSETS && typeof context.env.ASSETS.fetch === 'function') {
      return context.env.ASSETS.fetch(buildAssetRequest(context.request, '/'));
    }
  } catch (error) {
    console.error('[routes:p] asset fetch failed', error);
  }

  const url = new URL(context.request.url);
  return Response.redirect(`${url.origin}/?product=${encodeURIComponent(context.params.slug || '')}`, 302);
}
