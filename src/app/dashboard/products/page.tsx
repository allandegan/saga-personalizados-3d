"use client";

import { useEffect, useMemo, useState } from "react";

type Role = "ADMIN" | "OPERADOR" | "CONSULTA";

type Product = {
  id: string;
  name: string;
  price: number;
  category?: { id: string; name: string } | null;
  createdAt: string;
};

export default function ProductsPage() {
  const [me, setMe] = useState<{ name: string; role: Role } | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);

  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [priceInput, setPriceInput] = useState("");

  const canEdit = me?.role === "ADMIN" || me?.role === "OPERADOR";

  function formatBRL(v: number) {
    return v.toFixed(2).replace(".", ",");
  }

  function parsePriceBR(s: string) {
    // aceita "19,90" ou "19.90"
    const norm = String(s || "")
      .trim()
      .replace(/\s/g, "")
      .replace(".", "")
      .replace(",", ".");
    const n = Number(norm);
    return Number.isFinite(n) ? n : NaN;
  }

  async function load() {
    const r = await fetch("/api/products", { cache: "no-store", credentials: "include" });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j?.ok) {
      setMsg(j?.error || "Erro ao carregar produtos.");
      return;
    }
    setItems(j.items || []);
  }

  useEffect(() => {
    (async () => {
      setLoadingMe(true);
      const r = await fetch("/api/auth/me", { cache: "no-store", credentials: "include" });
      const j = await r.json().catch(() => ({}));

      if (!r.ok || !j?.logged) {
        window.location.href = "/login";
        return;
      }

      setMe({ name: j.user?.name || "Usuário", role: j.user?.role });
      setLoadingMe(false);

      // carrega produtos
      await load();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function add() {
    setMsg(null);

    if (!canEdit) {
      setMsg("Você não tem permissão para cadastrar.");
      return;
    }

    const p = parsePriceBR(priceInput);
    if (!name.trim()) {
      setMsg("Informe o nome do produto.");
      return;
    }
    if (!Number.isFinite(p)) {
      setMsg("Informe um preço válido (ex: 19,90).");
      return;
    }

    setLoading(true);
    try {
      const r = await fetch("/api/products", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: name.trim(), price: p })
      });

      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j?.ok) {
        setMsg(j?.error || "Erro ao salvar produto.");
        return;
      }

      setName("");
      setPriceInput("");
      await load();
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => {});
    window.location.href = "/login";
  }

  const rows = useMemo(() => items, [items]);

  if (loadingMe) {
    return <div style={{ padding: 18, fontFamily: "system-ui" }}>Carregando...</div>;
  }

  return (
    <div style={{ padding: 18, fontFamily: "system-ui" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 900 }}>S.A.G.A Personalizados 3D</div>
          <div style={{ color: "#6b7280", fontSize: 13 }}>
            Logado como <b>{me?.name}</b> ({me?.role})
          </div>
        </div>

        <button
          onClick={logout}
          style={{
            cursor: "pointer",
            borderRadius: 10,
            padding: "10px 12px",
            fontWeight: 800,
            border: "1px solid #e5e7eb",
            background: "white"
          }}
        >
          Sair
        </button>
      </div>

      {msg ? (
        <div style={{ marginTop: 14, background: "#fee2e2", color: "#991b1b", padding: 10, borderRadius: 10, fontSize: 13, fontWeight: 700 }}>
          {msg}
        </div>
      ) : null}

      <div style={{ marginTop: 16, display: "grid", gap: 10, padding: 14, border: "1px solid #e5e7eb", borderRadius: 12 }}>
        <div style={{ fontWeight: 900 }}>Cadastrar produto</div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 180px 140px", gap: 10, alignItems: "end" }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#6b7280", marginBottom: 6 }}>Nome</div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: Chaveiro PLA"
              disabled={!canEdit}
              style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #e5e7eb", outline: "none" }}
            />
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#6b7280", marginBottom: 6 }}>Preço (R$)</div>
            <input
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              placeholder="ex: 19,90"
              disabled={!canEdit}
              style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #e5e7eb", outline: "none" }}
            />
          </div>

          <button
            onClick={add}
            disabled={!canEdit || loading}
            style={{
              cursor: !canEdit || loading ? "not-allowed" : "pointer",
              border: "1px solid transparent",
              borderRadius: 10,
              padding: "10px 12px",
              fontWeight: 900,
              background: "#111827",
              color: "white",
              opacity: !canEdit || loading ? 0.6 : 1
            }}
          >
            {loading ? "Salvando..." : "Salvar"}
          </button>
        </div>

        {!canEdit ? <div style={{ color: "#6b7280", fontSize: 12 }}>Seu perfil é somente consulta.</div> : null}
      </div>

      <div style={{ marginTop: 16, padding: 14, border: "1px solid #e5e7eb", borderRadius: 12 }}>
        <div style={{ fontWeight: 900, marginBottom: 10 }}>Tabela de preços</div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: "10px 8px" }}>Produto</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: "10px 8px" }}>Preço</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: "10px 8px" }}>Categoria</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: "10px 8px" }}>Criado em</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: 12, color: "#6b7280" }}>
                    Nenhum produto cadastrado ainda.
                  </td>
                </tr>
              ) : (
                rows.map((p) => (
                  <tr key={p.id}>
                    <td style={{ borderBottom: "1px solid #f3f4f6", padding: "10px 8px", fontWeight: 700 }}>{p.name}</td>
                    <td style={{ borderBottom: "1px solid #f3f4f6", padding: "10px 8px" }}>R$ {formatBRL(Number(p.price))}</td>
                    <td style={{ borderBottom: "1px solid #f3f4f6", padding: "10px 8px" }}>{p.category?.name || "-"}</td>
                    <td style={{ borderBottom: "1px solid #f3f4f6", padding: "10px 8px", color: "#6b7280" }}>
                      {p.createdAt ? new Date(p.createdAt).toLocaleString("pt-BR") : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
