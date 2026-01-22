"use client";

import { useState } from "react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit() {
    setErr(null);
    setLoading(true);

    try {
      const r = await fetch("/api/auth/login-form", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username: username.trim(), password })
      });

      const j = await r.json().catch(() => ({}));

      if (!r.ok || !j?.ok) {
        setErr(j?.error || "Falha no login.");
        return;
      }

      // ✅ aqui NÃO usa token, só redireciona
      window.location.href = "/dashboard/products";
    } catch {
      setErr("Erro de rede no login.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f3f4f6", padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 420, background: "white", borderRadius: 16, padding: 18, boxShadow: "0 1px 12px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 6 }}>S.A.G.A Personalizados 3D</div>
        <div style={{ color: "#6b7280", marginBottom: 16 }}>Acesse com seu usuário e senha</div>

        {err ? (
          <div style={{ background: "#fee2e2", color: "#991b1b", padding: 10, borderRadius: 10, marginBottom: 12, fontSize: 13, fontWeight: 700 }}>
            {err}
          </div>
        ) : null}

        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", marginBottom: 6 }}>Usuário</div>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ex: Allan"
              autoComplete="username"
              style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #e5e7eb", outline: "none" }}
            />
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", marginBottom: 6 }}>Senha</div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #e5e7eb", outline: "none" }}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSubmit();
              }}
            />
          </div>

          <button
            type="button"
            onClick={onSubmit}
            disabled={loading}
            style={{
              cursor: loading ? "not-allowed" : "pointer",
              border: "1px solid transparent",
              borderRadius: 10,
              padding: "10px 12px",
              fontWeight: 800,
              background: "#111827",
              color: "white",
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </div>
      </div>
    </div>
  );
}
