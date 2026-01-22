"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Role = "ADMIN" | "OPERADOR" | "CONSULTA";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ name: string; username: string; role: Role } | null>(null);
  const [isSmall, setIsSmall] = useState(false);

  // Bloqueio por largura (somente computador)
  useEffect(() => {
    const check = () => setIsSmall(window.innerWidth < 900); // ajuste se quiser (ex: 800)
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/auth/me", { cache: "no-store" });
        const j = await r.json().catch(() => ({}));

        if (!j?.logged) {
          window.location.href = "/login";
          return;
        }

        setUser(j.user || null);
      } catch {
        window.location.href = "/login";
        return;
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    } finally {
      try {
        localStorage.removeItem("saga_token");
      } catch {}
      window.location.href = "/login";
    }
  }

  const isAdmin = user?.role === "ADMIN";

  const navLink = useMemo(
    () => (href: string, label: string) => (
      <Link
        href={href}
        style={{
          textDecoration: "none",
          padding: "8px 10px",
          borderRadius: 10,
          border: "1px solid #e5e7eb",
          background: "white",
          fontWeight: 800,
          color: "#111827",
          fontSize: 13
        }}
      >
        {label}
      </Link>
    ),
    []
  );

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f3f4f6", padding: 16 }}>
        <div
          style={{
            width: "100%",
            maxWidth: 520,
            background: "white",
            borderRadius: 16,
            padding: 18,
            boxShadow: "0 1px 12px rgba(0,0,0,0.06)"
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 6 }}>S.A.G.A Personalizados 3D</div>
          <div style={{ color: "#6b7280" }}>Carregando dashboard...</div>
        </div>
      </div>
    );
  }

  // 🔒 Bloqueio celular
  if (isSmall) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f3f4f6", padding: 16 }}>
        <div
          style={{
            width: "100%",
            maxWidth: 520,
            background: "white",
            borderRadius: 16,
            padding: 18,
            boxShadow: "0 1px 12px rgba(0,0,0,0.06)"
          }}
        >
          <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 6 }}>Acesso somente no computador</div>
          <div style={{ color: "#6b7280", marginBottom: 14 }}>
            Este sistema foi configurado para uso em telas maiores. Abra no PC/notebook.
          </div>

          <button
            onClick={logout}
            style={{
              cursor: "pointer",
              borderRadius: 10,
              padding: "10px 12px",
              fontWeight: 900,
              border: "1px solid #e5e7eb",
              background: "white"
            }}
          >
            Sair
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6" }}>
      <div style={{ position: "sticky", top: 0, zIndex: 10, background: "#f3f4f6", borderBottom: "1px solid #e5e7eb" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: 14, display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ display: "grid", gap: 2 }}>
            <div style={{ fontWeight: 900, fontSize: 16, color: "#111827" }}>S.A.G.A Personalizados 3D</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>
              {user ? `Logado: ${user.name} (${user.role})` : "Não autenticado"}
            </div>
          </div>

          <div style={{ flex: 1 }} />

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
            {navLink("/dashboard/products", "Produtos")}
            {navLink("/dashboard/categories", "Categorias")}

            {/* ✅ Relatórios: visível para TODOS (somente leitura) */}
            {navLink("/dashboard/reports/products", "Relatórios")}

            {/* 🔒 Apenas ADMIN */}
            {isAdmin ? navLink("/dashboard/users", "Usuários") : null}
            {isAdmin ? navLink("/dashboard/products/export", "Exportar") : null}

            <button
              onClick={logout}
              style={{
                cursor: "pointer",
                padding: "8px 10px",
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                background: "white",
                fontWeight: 900,
                fontSize: 13
              }}
            >
              Sair
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: 14 }}>{children}</div>
    </div>
  );
}
