"use client";

import { useState } from "react";

export default function SetupPage() {
  const [msg, setMsg] = useState<string>("");

  async function runMigrate() {
    setMsg("Rodando migrate...");
    const r = await fetch("/api/setup/migrate", { method: "POST" });
    const j = await r.json().catch(() => ({}));
    setMsg(JSON.stringify(j, null, 2));
  }

  async function createAdmin() {
    const name = prompt("Nome do admin:");
    const username = prompt("Usuário (login):");
    const password = prompt("Senha:");
    if (!name || !username || !password) return;

    setMsg("Criando admin...");
    const r = await fetch("/api/setup/admin", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, username, password })
    });
    const j = await r.json().catch(() => ({}));
    setMsg(JSON.stringify(j, null, 2));
  }

  return (
    <div style={{ padding: 18, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 20, fontWeight: 900 }}>Setup - S.A.G.A Personalizados 3D</h1>
      <p style={{ color: "#6b7280" }}>Tela temporária para criar tabelas e o primeiro admin.</p>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
        <button onClick={runMigrate} style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #e5e7eb", fontWeight: 800 }}>
          1) Rodar Migrations
        </button>
        <button onClick={createAdmin} style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #e5e7eb", fontWeight: 800 }}>
          2) Criar Admin
        </button>
        <a href="/login" style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #e5e7eb", fontWeight: 800, textDecoration: "none" }}>
          Ir para Login
        </a>
      </div>

      <pre style={{ marginTop: 14, background: "#111827", color: "white", padding: 12, borderRadius: 12, overflow: "auto" }}>
        {msg}
      </pre>
    </div>
  );
}
