export default function LoginPage({ searchParams }: { searchParams?: { e?: string } }) {
  const e = searchParams?.e;

  const msg =
    e === "missing" ? "Informe usuário e senha." :
    e === "invalid" ? "Usuário ou senha inválidos." :
    e === "server" ? "Erro interno no login (500). Vou precisar do log do Railway para corrigir." :
    null;

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f3f4f6", padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 420, background: "white", borderRadius: 16, padding: 18, boxShadow: "0 1px 12px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 6 }}>S.A.G.A Personalizados 3D</div>

        <div style={{ marginBottom: 10, padding: 8, borderRadius: 10, background: "#ecfeff", border: "1px solid #a5f3fc", fontWeight: 900 }}>
          LOGIN FORM V2 (sem JS)
        </div>

        <div style={{ color: "#6b7280", marginBottom: 16 }}>Acesse com seu usuário e senha</div>

        {msg ? (
          <div style={{ marginBottom: 12, padding: 10, borderRadius: 10, border: "1px solid #fecaca", background: "#fef2f2", color: "#991b1b", fontWeight: 700 }}>
            {msg}
          </div>
        ) : null}

        <form method="POST" action="/api/auth/login-form" style={{ display: "grid", gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", marginBottom: 6 }}>Usuário</div>
            <input
              name="username"
              placeholder="ex: Allan"
              autoComplete="username"
              style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #e5e7eb", outline: "none" }}
            />
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", marginBottom: 6 }}>Senha</div>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              autoComplete="current-password"
              style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #e5e7eb", outline: "none" }}
            />
          </div>

          <button
            type="submit"
            style={{ cursor: "pointer", border: "1px solid transparent", borderRadius: 10, padding: "10px 12px", fontWeight: 800, background: "#111827", color: "white" }}
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
