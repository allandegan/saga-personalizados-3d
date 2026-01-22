"use client";

import { useEffect, useState } from "react";

type Category = { id: string; name: string };

export default function ExportPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<string>("");

  async function loadCategories() {
    const r = await fetch("/api/categories", { cache: "no-store" });
    const t = await r.text();
    let j: any;
    try {
      j = t ? JSON.parse(t) : null;
    } catch {
      return;
    }
    if (r.ok && j?.ok) setCategories(j.categories || []);
  }

  useEffect(() => {
    loadCategories();
  }, []);

  const href = categoryId
    ? `/api/products/export?categoryId=${encodeURIComponent(categoryId)}`
    : `/api/products/export`;

  return (
    <div style={{ padding: 20, fontFamily: "system-ui" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>Exportar Produtos (CSV)</h1>

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

      <div style={{ marginTop: 10, marginBottom: 12, color: "#6b7280" }}>
        O arquivo CSV usa <b>;</b> (padrão Excel BR) e preço com <b>,</b>.
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          style={{ width: 320, padding: 10, borderRadius: 8, border: "1px solid #e5e7eb", background: "white" }}
        >
          <option value="">Todas as categorias</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <a
          href={href}
          style={{
            padding: "10px 14px",
            fontWeight: 900,
            borderRadius: 8,
            border: "1px solid transparent",
            background: "#111827",
            color: "white",
            textDecoration: "none",
            display: "inline-block"
          }}
        >
          Baixar CSV
        </a>
      </div>
    </div>
  );
}
