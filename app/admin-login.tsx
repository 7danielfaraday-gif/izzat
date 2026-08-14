"use client";

import { type FormEvent, useState } from "react";

export default function AdminLogin({ configured }: { configured: boolean }) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const login = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!configured || loading) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Não foi possível entrar.");
      window.location.replace("/admin");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível entrar.");
      setLoading(false);
    }
  };

  return <main className="admin-login-page"><section className="admin-login-card"><div className="admin-login-brand"><img src="/izzat-logo.png" alt="Izzat Express" /><span>ACESSO RESTRITO</span></div><div className="admin-login-heading"><span><i className="bi bi-shield-lock" /></span><h1>Painel administrativo</h1><p>Entre com sua senha para gerenciar a Izzat Express.</p></div>{configured ? <form onSubmit={login}><label htmlFor="admin-password">Senha</label><div className="admin-password-field"><i className="bi bi-lock" /><input id="admin-password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" placeholder="Digite sua senha" autoFocus required /><button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}><i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`} /></button></div>{error && <p className="admin-login-error" role="alert"><i className="bi bi-exclamation-circle" /> {error}</p>}<button className="admin-login-submit" type="submit" disabled={loading || !password}>{loading ? <><i className="bi bi-arrow-repeat" /> Verificando...</> : <>Entrar no painel <i className="bi bi-arrow-right" /></>}</button></form> : <div className="admin-auth-setup"><i className="bi bi-gear" /><div><b>Proteção aguardando configuração</b><p>Adicione as duas variáveis protegidas na Cloudflare e publique novamente.</p><code>IZZAT_ADMIN_PASSWORD</code><code>IZZAT_ADMIN_SESSION_SECRET</code></div></div>}<footer><i className="bi bi-lock-fill" /> Sessão protegida e válida por 12 horas</footer></section></main>;
}
