"use client";

import { useEffect, useState } from "react";

export default function ProductsPage() {
  const [status, setStatus] = useState("Verificando login...");

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem("saga_token");
      if (!token) {
        window.location.href = "/login";
        return;
      }

      const r = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` }
      });

      const j = await r.json().catch(() => ({}));
      if (!j?.logged) {
        localStorage.removeItem("saga_token");
        window.location.href = "/login";
        return;
      }

      setStatus(`Logado como ${j.user?.name} (${j.user?.role})`);
    })();
  }, []);

  function logout() {
    localStorage.removeItem("saga_token");
    window.location.href = "/login";
  }

  return (
    <div style={{ padding: 18 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 900 }}>S.A.G.A Personalizados 3D</div>
          <div style={{ color: "#6b7280" }}>{status}</div>
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

      <div style={{ marginTop: 18, padding: 14, border: "1px solid #e5e7eb", borderRadius: 12 }}>
        ✅ Acesso ao dashboard OK (token).
      </div>
    </div>
  );
}
