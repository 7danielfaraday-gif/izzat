export function json(data, status = 200, request = null) {
  const headers = {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store, max-age=0',
  };

  if (request) {
    const origin = request.headers.get('origin');
    if (origin) headers['access-control-allow-origin'] = origin;
  }

  return new Response(JSON.stringify(data), { status, headers });
}

export function badRequest(error = 'bad_request', request = null) {
  return json({ ok: false, error }, 400, request);
}
