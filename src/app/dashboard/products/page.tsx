"use client";

export default function ProductsPage() {
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <div style={{ padding: 18 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 900 }}>S.A.G.A Personalizados 3D</div>
          <div style={{ color: "#6b7280" }}>Dashboard (logado)</div>
        </div>
        <button
          onClick={logout}
          style={{ cursor: "pointer", borderRadius: 10, padding: "10px 12px", fontWeight: 800, border: "1px solid #e5e7eb", background: "white" }}
        >
          Sair
        </button>
      </div>

      <div style={{ marginTop: 18, padding: 14, border: "1px solid #e5e7eb", borderRadius: 12 }}>
        ✅ Login conectado ao banco e sessão ativa.
        <div style={{ color: "#6b7280", marginTop: 6 }}>
          Próximo passo: tela completa de produtos + cálculo automático + exportações.
        </div>
      </div>
    </div>
  );
}
