"use client";

import { useState } from "react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  async function onSubmit() {
    const res = await fetch("/api/auth/login", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ username, password })
});

const data = await res.json();

if (!res.ok) {
  // mostrar data.error
  return;
}

localStorage.setItem("saga_token", data.token);
window.location.href = "/dashboard/products";
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f3f4f6", padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 420, background: "white", borderRadius: 16, padding: 18, boxShadow: "0 1px 12px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 6 }}>S.A.G.A Personalizados 3D</div>
        <div style={{ color: "#6b7280", marginBottom: 16 }}>Acesse com seu usuário e senha</div>

        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", marginBottom: 6 }}>Usuário</div>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ex: Allan"
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
              style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #e5e7eb", outline: "none" }}
            />
          </div>

          <button
            onClick={onSubmit}
            style={{ cursor: "pointer", border: "1px solid transparent", borderRadius: 10, padding: "10px 12px", fontWeight: 800, background: "#111827", color: "white" }}
          >
            Entrar
          </button>
        </div>
      </div>
    </div>
  );
}
