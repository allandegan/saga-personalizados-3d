"use client";

import { useEffect, useState } from "react";

type HistoryItem = {
  id: string;
  oldPrice: number | null;
  newPrice: number;
  note: string | null;
  changedAt: string;
};

export default function ProductHistoryPage({ params }: { params: { id: string } }) {
  const id = params.id;

  const [name, setName] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    const r = await fetch(`/api/products/${id}/history`, { cache: "no-store" });
    const t = await r.text();

    let j: any;
    try {
      j = t ? JSON.parse(t) : null;
    } catch {
      setError("Resposta inválida da API.");
      return;
    }

    if (!r.ok || !j?.ok) {
      setError(j?.error || "Erro ao carregar histórico.");
      return;
    }

    setName(j.product?.name || "");
    setPrice(Number(j.product?.price || 0));
    setItems(j.history || []);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div style={{ padding: 20, fontFamily: "system-ui" }}>
      <div style={{ display: "flex", gap: 10, alignItems: "baseline", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 6 }}>Histórico de Preços</h1>
          <div style={{ color: "#6b7280" }}>
            Produto: <b>{name || "(carregando...)"}</b> • Atual: <b>R$ {price.toFixed(2).replace(".", ",")}</b>
          </div>
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
          Voltar
        </a>
      </div>

      {error && (
        <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: "#fee2e2", color: "#991b1b", fontWeight: 700 }}>
          {error}
        </div>
      )}

      <div style={{ marginTop: 14, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 820 }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #e5e7eb" }}>Quando</th>
              <th style={{ textAlign: "right", padding: 10, borderBottom: "1px solid #e5e7eb" }}>De (R$)</th>
              <th style={{ textAlign: "right", padding: 10, borderBottom: "1px solid #e5e7eb" }}>Para (R$)</th>
              <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #e5e7eb" }}>Observação</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: 14, color: "#6b7280" }}>
                  Nenhum histórico ainda.
                </td>
              </tr>
            ) : (
              items.map((h) => (
                <tr key={h.id}>
                  <td style={{ padding: 10, borderBottom: "1px solid #f3f4f6" }}>
                    {new Date(h.changedAt).toLocaleString("pt-BR")}
                  </td>
                  <td style={{ padding: 10, borderBottom: "1px solid #f3f4f6", textAlign: "right" }}>
                    {h.oldPrice === null ? "-" : Number(h.oldPrice).toFixed(2).replace(".", ",")}
                  </td>
                  <td style={{ padding: 10, borderBottom: "1px solid #f3f4f6", textAlign: "right" }}>
                    {Number(h.newPrice).toFixed(2).replace(".", ",")}
                  </td>
                  <td style={{ padding: 10, borderBottom: "1px solid #f3f4f6" }}>{h.note || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
