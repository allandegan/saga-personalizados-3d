"use client";

import { useEffect, useMemo, useState } from "react";

type Category = { id: string; name: string };

export default function ProductsReportPage() {
  const [cats, setCats] = useState<Category[]>([]);
  const [from, setFrom] = useState(""); // yyyy-mm-dd
  const [to, setTo] = useState(""); // yyyy-mm-dd
  const [categoryId, setCategoryId] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [data, setData] = useState<any>(null);

  const money = useMemo(() => {
    return (n: number) => `R$ ${Number(n || 0).toFixed(2).replace(".", ",")}`;
  }, []);

  async function boot() {
    const rMe = await fetch("/api/auth/me", { cache: "no-store" });
    const jMe = await rMe.json().catch(() => ({}));
    if (!jMe?.logged) {
      window.location.href = "/login";
      return;
    }

    const rCats = await fetch("/api/categories", { cache: "no-store" });
    const jCats = await rCats.json().catch(() => ({}));
    if (jCats?.ok) setCats(jCats.items || []);
  }

  useEffect(() => {
    boot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function buildQS() {
    const qs = new URLSearchParams();
    if (from) qs.set("from", `${from}T00:00:00.000Z`);
    if (to) qs.set("to", `${to}T23:59:59.999Z`);
    if (categoryId) qs.set("categoryId", categoryId);
    return qs.toString();
  }

  async function load() {
    setErr(null);
    setLoading(true);
    try {
      const qs = buildQS();
      const r = await fetch(`/api/reports/products?${qs}`, { cache: "no-store" });
      const j = await r.json().catch(() => ({}));

      if (!r.ok || !j?.ok) {
        setErr(j?.error || "Erro ao carregar relatório.");
        setData(null);
        return;
      }

      setData(j);
    } catch {
      setErr("Erro ao carregar relatório.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  function downloadCSV() {
    const qs = buildQS();
    // abre o download em nova aba
    window.open(`/api/reports/products/csv?${qs}`, "_blank");
  }

  const td = () => ({
    padding: "10px 10px",
    borderBottom: "1px solid #e5e7eb",
    verticalAlign: "top" as const
  });

  return (
    <div style={{ padding: 18 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: 22 }}>Relatório de Produtos</div>
          <div style={{ color: "#6b7280", fontSize: 12 }}>
            Por período e categoria (soma, média, mínimo, máximo)
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <button
            onClick={downloadCSV}
            disabled={!data || loading}
            style={{
              cursor: !data || loading ? "not-allowed" : "pointer",
              borderRadius: 10,
              padding: "10px 12px",
              fontWeight: 900,
              border: "1px solid #e5e7eb",
              background: "white",
              color: "#111827",
              opacity: !data || loading ? 0.6 : 1
            }}
            title={!data ? "Gere o relatório primeiro para liberar o CSV." : "Baixar CSV"}
          >
            Baixar CSV
          </button>

          <button
            onClick={load}
            style={{
              cursor: "pointer",
              borderRadius: 10,
              padding: "10px 12px",
              fontWeight: 900,
              border: "1px solid #111827",
              background: "#111827",
              color: "white"
            }}
          >
            {loading ? "Carregando..." : "Gerar relatório"}
          </button>
        </div>
      </div>

      {err ? (
        <div style={{ marginBottom: 12, padding: 10, borderRadius: 10, border: "1px solid #fecaca", background: "#fff1f2", color: "#991b1b" }}>
          {err}
        </div>
      ) : null}

      <div style={{ marginBottom: 14, padding: 12, borderRadius: 12, border: "1px solid #e5e7eb", background: "white" }}>
        <div style={{ display: "grid", gridTemplateColumns: "0.6fr 0.6fr 1fr", gap: 10 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#6b7280", marginBottom: 6 }}>De</div>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #e5e7eb" }}
            />
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#6b7280", marginBottom: 6 }}>Até</div>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #e5e7eb" }}
            />
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#6b7280", marginBottom: 6 }}>Categoria</div>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #e5e7eb", background: "white" }}
            >
              <option value="">(todas)</option>
              {cats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginTop: 10, color: "#6b7280", fontSize: 12 }}>
          Dica: gere primeiro o relatório. Depois o botão “Baixar CSV” libera.
        </div>
      </div>

      {data ? (
        <>
          <div style={{ marginBottom: 14, padding: 12, borderRadius: 12, border: "1px solid #e5e7eb", background: "white" }}>
            <div style={{ fontWeight: 900, marginBottom: 8 }}>Resumo</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
              <div style={{ padding: 10, border: "1px solid #e5e7eb", borderRadius: 12 }}>
                <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 800 }}>Qtd. produtos</div>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{data?.totals?.totalCount ?? 0}</div>
              </div>
              <div style={{ padding: 10, border: "1px solid #e5e7eb", borderRadius: 12 }}>
                <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 800 }}>Soma total</div>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{money(data?.totals?.sum ?? 0)}</div>
              </div>
              <div style={{ padding: 10, border: "1px solid #e5e7eb", borderRadius: 12 }}>
                <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 800 }}>Preço médio</div>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{money(data?.totals?.avg ?? 0)}</div>
              </div>
            </div>
          </div>

          <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden", background: "white" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  <th style={{ ...td(), textAlign: "left", fontSize: 12, color: "#6b7280" }}>Categoria</th>
                  <th style={{ ...td(), textAlign: "left", fontSize: 12, color: "#6b7280" }}>Qtd</th>
                  <th style={{ ...td(), textAlign: "left", fontSize: 12, color: "#6b7280" }}>Soma</th>
                  <th style={{ ...td(), textAlign: "left", fontSize: 12, color: "#6b7280" }}>Média</th>
                  <th style={{ ...td(), textAlign: "left", fontSize: 12, color: "#6b7280" }}>Min</th>
                  <th style={{ ...td(), textAlign: "left", fontSize: 12, color: "#6b7280" }}>Max</th>
                </tr>
              </thead>

              <tbody>
                {(data?.byCategory || []).map((r: any, idx: number) => (
                  <tr key={idx}>
                    <td style={td()}><b>{r.categoryName}</b></td>
                    <td style={td()}>{r.count}</td>
                    <td style={td()}>{money(r.sum)}</td>
                    <td style={td()}>{money(r.avg)}</td>
                    <td style={td()}>{money(r.min)}</td>
                    <td style={td()}>{money(r.max)}</td>
                  </tr>
                ))}
                {(data?.byCategory || []).length === 0 ? (
                  <tr>
                    <td style={td()} colSpan={6}>
                      <div style={{ padding: 10, color: "#6b7280" }}>Sem dados para os filtros selecionados.</div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}
