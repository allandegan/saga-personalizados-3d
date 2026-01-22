"use client";

import { useEffect, useMemo, useState } from "react";

type Role = "ADMIN" | "OPERADOR" | "CONSULTA";

type Category = { id: string; name: string };

type Product = {
  id: string;
  name: string;
  price: number;
  createdAt: string;
  category?: { id: string; name: string } | null;
};

export default function ProductsPage() {
  const [loading, setLoading] = useState(false);
  const [boot, setBoot] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [me, setMe] = useState<{ role: Role; name: string; username: string } | null>(null);

  const [items, setItems] = useState<Product[]>([]);
  const [cats, setCats] = useState<Category[]>([]);

  const [name, setName] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");

  const isAdmin = me?.role === "ADMIN";
  const isOperador = me?.role === "OPERADOR";
  const isConsulta = me?.role === "CONSULTA";

  const canCreate = isAdmin || isOperador; // B
  const canEditNameCategory = isAdmin || isOperador; // B
  const canEditPrice = isAdmin; // B

  function parseBRL(s: string) {
    const raw = String(s || "")
      .trim()
      .replace(/\s/g, "")
      .replace(/^R\$\s*/i, "")
      .replace(/\./g, "")
      .replace(",", ".");
    const n = Number(raw);
    return Number.isFinite(n) ? n : NaN;
  }

  async function loadAll() {
    setError(null);
    try {
      const [rMe, rCats, rProds] = await Promise.all([
        fetch("/api/auth/me", { cache: "no-store" }),
        fetch("/api/categories", { cache: "no-store" }),
        fetch("/api/products", { cache: "no-store" })
      ]);

      const jMe = await rMe.json().catch(() => ({}));
      if (!jMe?.logged) {
        window.location.href = "/login";
        return;
      }
      setMe(jMe.user);

      const jCats = await rCats.json().catch(() => ({}));
      if (jCats?.ok) setCats(jCats.items || []);

      const jProds = await rProds.json().catch(() => ({}));
      if (jProds?.ok) setItems(jProds.items || []);
      else setError(jProds?.error || "Erro ao carregar produtos.");
    } catch {
      setError("Erro ao carregar dados.");
    } finally {
      setBoot(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function add() {
    setError(null);

    if (!canCreate) {
      setError("Seu perfil é CONSULTA. Você não pode cadastrar.");
      return;
    }

    const nm = name.trim();
    const price = parseBRL(unitPrice);

    if (!nm) {
      setError("Informe o nome do produto.");
      return;
    }
    if (!Number.isFinite(price)) {
      setError("Preço inválido. Ex: 19,90");
      return;
    }

    setLoading(true);
    try {
      const r = await fetch("/api/products", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: nm,
          unitPrice: price,
          categoryId: categoryId || null
        })
      });

      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j?.ok) {
        setError(j?.error || "Erro ao cadastrar produto.");
        return;
      }

      setName("");
      setUnitPrice("");
      setCategoryId("");
      await loadAll();
    } finally {
      setLoading(false);
    }
  }

  async function rename(p: Product) {
    if (!canEditNameCategory) return;

    const newName = window.prompt("Novo nome do produto:", p.name);
    if (newName === null) return;
    const nm = newName.trim();
    if (!nm) return alert("Nome inválido.");

    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/products/${p.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: nm })
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j?.ok) {
        setError(j?.error || "Erro ao renomear.");
        return;
      }
      await loadAll();
    } finally {
      setLoading(false);
    }
  }

  async function changeCategory(p: Product) {
    if (!canEditNameCategory) return;

    const current = p.category?.id || "";
    const options = ["(sem categoria)", ...cats.map((c) => c.name)];
    const pick = window.prompt(
      `Digite o nome da categoria exatamente como está na lista:\n\n${options.join("\n")}\n\nCategoria atual: ${
        p.category?.name || "(sem)"
      }`,
      p.category?.name || ""
    );
    if (pick === null) return;

    const chosen = pick.trim();
    const cat =
      chosen === "" || chosen === "(sem categoria)" || chosen === "(sem)"
        ? null
        : cats.find((c) => c.name.toLowerCase() === chosen.toLowerCase()) || null;

    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/products/${p.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ categoryId: cat ? cat.id : null })
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j?.ok) {
        setError(j?.error || "Erro ao alterar categoria.");
        return;
      }
      await loadAll();
    } finally {
      setLoading(false);
    }
  }

  async function changePrice(p: Product) {
    if (!canEditPrice) return;

    const current = Number(p.price).toFixed(2).replace(".", ",");
    const raw = window.prompt("Novo preço (ex: 19,90):", current);
    if (raw === null) return;

    const price = parseBRL(raw);
    if (!Number.isFinite(price)) return alert("Preço inválido. Ex: 19,90");

    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/products/${p.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ unitPrice: price })
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j?.ok) {
        setError(j?.error || "Erro ao alterar preço.");
        return;
      }
      await loadAll();
    } finally {
      setLoading(false);
    }
  }

  const money = useMemo(() => {
    return (n: number) => `R$ ${Number(n).toFixed(2).replace(".", ",")}`;
  }, []);

  if (boot) {
    return (
      <div style={{ padding: 18 }}>
        <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 6 }}>Produtos</div>
        <div style={{ color: "#6b7280" }}>Carregando...</div>
      </div>
    );
  }

  const td = () => ({
    padding: "10px 10px",
    borderBottom: "1px solid #e5e7eb",
    verticalAlign: "top" as const
  });

  return (
    <div style={{ padding: 4 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: 20 }}>Produtos</div>
          <div style={{ color: "#6b7280", fontSize: 12 }}>
            Perfil: <b>{me?.role}</b> • {me?.name}
          </div>
        </div>

        <button
          onClick={loadAll}
          style={{
            cursor: "pointer",
            borderRadius: 10,
            padding: "8px 10px",
            fontWeight: 900,
            border: "1px solid #e5e7eb",
            background: "white"
          }}
        >
          Recarregar
        </button>
      </div>

      {error ? (
        <div style={{ marginBottom: 12, padding: 10, borderRadius: 10, border: "1px solid #fecaca", background: "#fff1f2", color: "#991b1b" }}>
          {error}
        </div>
      ) : null}

      {/* Formulário: somente ADMIN/OPERADOR */}
      {canCreate ? (
        <div style={{ marginBottom: 14, padding: 12, borderRadius: 12, border: "1px solid #e5e7eb", background: "white" }}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>Cadastrar produto</div>

          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.6fr 0.8fr 0.4fr", gap: 10, alignItems: "end" }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#6b7280", marginBottom: 6 }}>Nome</div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Chaveiro PLA"
                style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #e5e7eb", outline: "none" }}
              />
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#6b7280", marginBottom: 6 }}>Preço</div>
              <input
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="Ex: 19,90"
                style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #e5e7eb", outline: "none" }}
              />
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#6b7280", marginBottom: 6 }}>Categoria</div>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #e5e7eb", outline: "none", background: "white" }}
              >
                <option value="">(sem categoria)</option>
                {cats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              disabled={loading}
              onClick={add}
              style={{
                cursor: loading ? "not-allowed" : "pointer",
                borderRadius: 10,
                padding: "10px 12px",
                fontWeight: 900,
                border: "1px solid transparent",
                background: "#111827",
                color: "white",
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? "Salvando..." : "Cadastrar"}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: 14, padding: 12, borderRadius: 12, border: "1px solid #e5e7eb", background: "white", color: "#6b7280" }}>
          Você está em modo <b>CONSULTA</b>. Pode apenas visualizar.
        </div>
      )}

      {/* Tabela */}
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden", background: "white" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f9fafb" }}>
              <th style={{ ...td(), textAlign: "left", fontSize: 12, color: "#6b7280" }}>Produto</th>
              <th style={{ ...td(), textAlign: "left", fontSize: 12, color: "#6b7280" }}>Categoria</th>
              <th style={{ ...td(), textAlign: "left", fontSize: 12, color: "#6b7280" }}>Preço</th>
              <th style={{ ...td(), textAlign: "left", fontSize: 12, color: "#6b7280" }}>Criado em</th>
              <th style={{ ...td(), textAlign: "left", fontSize: 12, color: "#6b7280", width: 340 }}>Ações</th>
            </tr>
          </thead>

          <tbody>
            {items.length === 0 ? (
              <tr>
                <td style={td()} colSpan={5}>
                  <div style={{ padding: 10, color: "#6b7280" }}>Nenhum produto cadastrado ainda.</div>
                </td>
              </tr>
            ) : (
              items.map((p) => (
                <tr key={p.id}>
                  <td style={td()}>
                    <div style={{ fontWeight: 900 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>{p.id}</div>
                  </td>

                  <td style={td()}>{p.category?.name || <span style={{ color: "#6b7280" }}>(sem)</span>}</td>

                  <td style={td()}>{money(p.price)}</td>

                  <td style={td()}>{new Date(p.createdAt).toLocaleString("pt-BR")}</td>

                  <td style={td()}>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {/* CONSULTA não vê botões */}
                      {canEditNameCategory ? (
                        <>
                          <button
                            onClick={() => rename(p)}
                            style={{
                              cursor: "pointer",
                              borderRadius: 10,
                              padding: "8px 10px",
                              fontWeight: 900,
                              border: "1px solid #e5e7eb",
                              background: "white"
                            }}
                          >
                            Nome
                          </button>

                          <button
                            onClick={() => changeCategory(p)}
                            style={{
                              cursor: "pointer",
                              borderRadius: 10,
                              padding: "8px 10px",
                              fontWeight: 900,
                              border: "1px solid #e5e7eb",
                              background: "white"
                            }}
                          >
                            Categoria
                          </button>
                        </>
                      ) : null}

                      {/* Preço só ADMIN (Regra B) */}
                      {canEditPrice ? (
                        <button
                          onClick={() => changePrice(p)}
                          style={{
                            cursor: "pointer",
                            borderRadius: 10,
                            padding: "8px 10px",
                            fontWeight: 900,
                            border: "1px solid #111827",
                            background: "#111827",
                            color: "white"
                          }}
                        >
                          Preço
                        </button>
                      ) : null}

                      {/* Dica pro operador */}
                      {isOperador ? (
                        <span style={{ fontSize: 12, color: "#6b7280", alignSelf: "center" }}>
                          (Operador não altera preço)
                        </span>
                      ) : null}
                    </div>
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
