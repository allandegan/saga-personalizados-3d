"use client";

import { useEffect, useMemo, useState } from "react";

type Category = { id: string; name: string; createdAt?: string };
type Role = "ADMIN" | "OPERADOR" | "CONSULTA";

export default function CategoriesPage() {
  const [role, setRole] = useState<Role>("CONSULTA");
  const canWrite = role === "ADMIN" || role === "OPERADOR";

  const [items, setItems] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  async function loadMe() {
    const r = await fetch("/api/auth/me", { cache: "no-store" });
    const t = await r.text();
    const j = t ? JSON.parse(t) : null;
    if (j?.ok && j?.user?.role) setRole(j.user.role);
  }

  async function load() {
    setError(null);
    const r = await fetch("/api/categories", { cache: "no-store" });
    const t = await r.text();

    let j: any;
    try {
      j = t ? JSON.parse(t) : null;
    } catch {
      setError(`Resposta inválida da API (status ${r.status}).`);
      return;
    }

    if (!r.ok || !j?.ok) {
      setError(j?.error || `Erro ao carregar (status ${r.status}).`);
      return;
    }

    setItems(j.categories || []);
  }

  useEffect(() => {
    loadMe();
    load();
  }, []);

  async function add() {
    if (!canWrite) return;
    setError(null);
    setLoading(true);

    try {
      const r = await fetch("/api/categories", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name })
      });

      const t = await r.text();
      let j: any;

      try {
        j = t ? JSON.parse(t) : null;
      } catch {
        setError(`Resposta inválida da API ao salvar (status ${r.status}).`);
        return;
      }

      if (!r.ok || !j?.ok) {
        setError(j?.error || `Erro ao salvar (status ${r.status}).`);
        return;
      }

      setName("");
      await load();
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((c) => c.name.toLowerCase().includes(q));
  }, [items, query]);

  return (
    <div style={{ padding: 20, fontFamily: "system-ui" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>Categorias</h1>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ color: "#6b7280", fontSize: 12 }}>
            Perfil: <b>{role}</b>
          </div>

          <a
            href="/dashboard/products"
            style={{
              padding: "8px 10px",
              fontWeight: 900,
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              background: "white",
              color: "#111827",
              textDecoration: "none"
            }}
          >
            Voltar aos Produtos
          </a>
        </div>
      </div>

      {role === "CONSULTA" && (
        <div style={{ marginBottom: 12, padding: 10, borderRadius: 8, background: "#eff6ff", color: "#1e40af", fontWeight: 700 }}>
          Você está como <b>CONSULTA</b>: pode apenas visualizar.
        </div>
      )}

      {error && (
        <div style={{ marginBottom: 12, padding: 10, borderRadius: 8, background: "#fee2e2", color: "#991b1b", fontWeight: 700 }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 12, maxWidth: 980 }}>
        <input
          placeholder="Nome da categoria (ex: Chaveiros)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={!canWrite}
          style={{ flex: 2, padding: 10, borderRadius: 8, border: "1px solid #e5e7eb", opacity: canWrite ? 1 : 0.6 }}
        />

        <button
          onClick={add}
          disabled={!canWrite || loading}
          style={{
            padding: "10px 14px",
            fontWeight: 800,
            borderRadius: 8,
            border: "1px solid transparent",
            background: "#111827",
            color: "white",
            cursor: !canWrite || loading ? "not-allowed" : "pointer",
            opacity: !canWrite || loading ? 0.6 : 1
          }}
        >
          {loading ? "Salvando..." : "Cadastrar"}
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12, maxWidth: 980 }}>
        <input
          placeholder="Buscar categoria..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }}
        />

        <button
          onClick={() => setQuery("")}
          style={{
            padding: "10px 14px",
            fontWeight: 800,
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            background: "white",
            cursor: "pointer"
          }}
        >
          Limpar
        </button>
      </div>

      <div style={{ color: "#6b7280", fontSize: 12, marginBottom: 10 }}>
        Mostrando <b>{filtered.length}</b> de <b>{items.length}</b> categorias.
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #e5e7eb" }}>Categoria</th>
              <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #e5e7eb" }}>Criada em</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={2} style={{ padding: 14, color: "#6b7280" }}>
                  Nenhuma categoria.
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id}>
                  <td style={{ padding: 10, borderBottom: "1px solid #f3f4f6" }}>{c.name}</td>
                  <td style={{ padding: 10, borderBottom: "1px solid #f3f4f6", color: "#6b7280" }}>
                    {c.createdAt ? new Date(c.createdAt).toLocaleString("pt-BR") : "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
