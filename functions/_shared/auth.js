export function unauthorized(realm = 'PIX Admin') {
  return new Response('Unauthorized', {
    status: 401,
    headers: {
      'cache-control': 'no-store, max-age=0',
      'www-authenticate': `Basic realm="${realm}", charset="UTF-8"`,
    },
  });
}

export function checkBasicAuth(request, env) {
  const user = env.PIX_ADMIN_USER;
  const pass = env.PIX_ADMIN_PASS;

  if (!user || !pass) return false;

  const auth = request.headers.get('authorization') || '';
  const match = auth.match(/^Basic\s+(.+)$/i);
  if (!match) return false;

  let decoded = '';
  try {
    decoded = atob(match[1]);
  } catch {
    return false;
  }

  const separatorIndex = decoded.indexOf(':');
  if (separatorIndex < 0) return false;

  return decoded.slice(0, separatorIndex) === user && decoded.slice(separatorIndex + 1) === pass;
}
