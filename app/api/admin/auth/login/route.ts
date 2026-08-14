import { adminAuthConfigured, adminSessionCookie, clearFailedLogins, createAdminSession, loginAttemptAllowed, registerFailedLogin, verifyAdminPassword } from "../../../../admin-auth";

export async function POST(request: Request) {
  if (!adminAuthConfigured()) return Response.json({ error: "Login ainda não configurado." }, { status: 503 });
  if (!(await loginAttemptAllowed(request))) return Response.json({ error: "Muitas tentativas. Aguarde 15 minutos." }, { status: 429 });

  let password = "";
  try {
    const payload = await request.json() as { password?: unknown };
    password = typeof payload.password === "string" ? payload.password.slice(0, 256) : "";
  } catch {
    return Response.json({ error: "Solicitação inválida." }, { status: 400 });
  }

  if (!(await verifyAdminPassword(password))) {
    await registerFailedLogin(request);
    return Response.json({ error: "Senha incorreta." }, { status: 401 });
  }

  await clearFailedLogins(request);
  const token = await createAdminSession();
  const secure = new URL(request.url).protocol === "https:";
  return Response.json({ authenticated: true }, {
    headers: { "Set-Cookie": adminSessionCookie(token, secure), "Cache-Control": "no-store" },
  });
}
