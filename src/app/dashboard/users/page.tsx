"use client";

import { useEffect, useMemo, useState } from "react";

type Role = "ADMIN" | "OPERADOR" | "CONSULTA";
type User = { id: string; name: string; username: string; role: Role; createdAt?: string };

export default function UsersPage() {
  const [meRole, setMeRole] = useState<Role>("CONSULTA");
  const isAdmin = meRole === "ADMIN";

  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<Role>("OPERADOR");
  const [password, setPassword] = useState("");

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadMe() {
    const r = await fetch("/api/auth/me", { cache: "no-store" });
    const t = await r.text();
    const j = t ? JSON.parse(t) : null;
    if (j?.ok && j?.user?.role) setMeRole(j.user.role);
  }

  async function load() {
    setError(null);
    const r = await fetch("/api/users", { cache: "no-store" });
    const t = await r.text();
    let j: any;
    try {
      j = t ? JSON.parse(t) : null;
    } catch {
      setError("Resposta inválida da API.");
      return;
    }

    if (!r.ok || !j?.ok) {
      setError(j?.error || `Erro (status ${r.status}).`);
      return;
    }

    setUsers(j.users || []);
  }

  useEffect(() => {
    loadMe().then(load);
  }, []);

  async function createUser() {
    if (!isAdmin) return;
    setError(null);
    setLoading(true);

    try {
      const r = await fetch("/api/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, username, role, password })
      });

      const t = await r.text();
      let j: any;
      try {
        j = t ? JSON.parse(t) : null;
      } catch {
        setError(`Resposta inválida ao salvar (status ${r.status}).`);
        return;
      }

      if (!r.ok || !j?.ok) {
        setError(j?.error || `Erro ao criar (status ${r.status}).`);
        return;
      }

      setName("");
      setUsername("");
      setRole("OPERADOR");
      setPassword("");
      await load();
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(u: User) {
    if (!isAdmin) return;
    setError(null);

    const newPass = window.prompt(`Nova senha para ${u.username}:`);
    if (!newPass) return;

    const r = await fetch(`/api/users/${u.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password: newPass })
    });

    const t = await r.text();
    let j: any;
    try {
      j = t ? JSON.parse(t) : null;
    } catch {
      setError(`Resposta inválida ao resetar (status ${r.status}).`);
      return;
    }

    if (!r.ok || !j?.ok) {
      setError(j?.error || `Erro ao resetar (status ${r.status}).`);
      return;
    }

    await load();
    alert("Senha alterada com sucesso.");
  }

  async function remove(u: User) {
    if (!isAdmin) return;

    const ok = window.confirm(`Excluir o usuário "${u.username}"?\n\nEssa ação não pode ser desfeita.`);
    if (!ok) return;

    const r = await fetch(`/api/users/${u.id}`, { method: "DELETE" });
    const t = await r.text();

    let j: any;
    try {
      j = t ? JSON.parse(t) : null;
    } catch {
      setError(`Resposta inválida ao excluir (status ${r.status}).`);
      return;
    }

    if (!r.ok || !j?.ok) {
      setError(j?.error || `Erro ao excluir (status ${r.status}).`);
      return;
    }

    await load();
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
    );
  }, [users, query]);

  return (
    <div style={{ padding: 20, fontFamily: "system-ui" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>Usuários</h1>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ color: "#6b7280", fontSize: 12 }}>
            Perfil: <b>{meRole}</b>
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
            Produtos
          </a>
        </div>
      </div>

      {!isAdmin && (
        <div style={{ marginBottom: 12, padding: 10, borderRadius: 8, background: "#fee2e2", color: "#991b1b", fontWeight: 800 }}>
          Somente <b>ADMIN</b> pode gerenciar usuários.
        </div>
      )}

      {error && (
        <div style={{ marginBottom: 12, padding: 10, borderRadius: 8, background: "#fee2e2", color: "#991b1b", fontWeight: 700 }}>
          {error}
        </div>
      )}

      {/* Criar */}
      <div style={{ padding: 12, border: "1px solid #e5e7eb", borderRadius: 12, marginBottom: 14, background: "white", maxWidth: 1100 }}>
        <div style={{ fontWeight: 900, marginBottom: 8 }}>Criar novo usuário</div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            placeholder="Nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!isAdmin}
            style={{ flex: "1 1 240px", padding: 10, borderRadius: 8, border: "1px solid #e5e7eb", opacity: isAdmin ? 1 : 0.6 }}
          />

          <input
            placeholder="Usuário (login)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={!isAdmin}
            style={{ flex: "1 1 220px", padding: 10, borderRadius: 8, border: "1px solid #e5e7eb", opacity: isAdmin ? 1 : 0.6 }}
          />

          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            disabled={!isAdmin}
            style={{ width: 200, padding: 10, borderRadius: 8, border: "1px solid #e5e7eb", background: "white", opacity: isAdmin ? 1 : 0.6 }}
          >
            <option value="OPERADOR">OPERADOR</option>
            <option value="CONSULTA">CONSULTA</option>
            <option value="ADMIN">ADMIN</option>
          </select>

          <input
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={!isAdmin}
            type="password"
            style={{ flex: "1 1 220px", padding: 10, borderRadius: 8, border: "1px solid #e5e7eb", opacity: isAdmin ? 1 : 0.6 }}
          />

          <button
            onClick={createUser}
            disabled={!isAdmin || loading}
            style={{
              padding: "10px 14px",
              fontWeight: 900,
              borderRadius: 8,
              border: "1px solid transparent",
              background: "#111827",
              color: "white",
              cursor: !isAdmin || loading ? "not-allowed" : "pointer",
              opacity: !isAdmin || loading ? 0.6 : 1
            }}
          >
            {loading ? "Salvando..." : "Criar"}
          </button>
        </div>

        <div style={{ marginTop: 8, color: "#6b7280", fontSize: 12 }}>
          Dica: Use login simples sem espaços (ex: <b>op1</b>). Se criar ADMIN, não esqueça de guardar a senha.
        </div>
      </div>

      {/* Busca */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10, maxWidth: 1100 }}>
        <input
          placeholder="Buscar (nome, login, role)…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }}
        />
        <button
          onClick={() => setQuery("")}
          style={{ padding: "10px 14px", fontWeight: 900, borderRadius: 8, border: "1px solid #e5e7eb", background: "white", cursor: "pointer" }}
        >
          Limpar
        </button>
      </div>

      {/* Tabela */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 920 }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #e5e7eb" }}>Nome</th>
              <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #e5e7eb" }}>Login</th>
              <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #e5e7eb" }}>Role</th>
              <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #e5e7eb" }}>Criado em</th>
              <th style={{ textAlign: "right", padding: 10, borderBottom: "1px solid #e5e7eb" }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 14, color: "#6b7280" }}>
                  Nenhum usuário.
                </td>
              </tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.id}>
                  <td style={{ padding: 10, borderBottom: "1px solid #f3f4f6" }}>{u.name}</td>
                  <td style={{ padding: 10, borderBottom: "1px solid #f3f4f6" }}>{u.username}</td>
                  <td style={{ padding: 10, borderBottom: "1px solid #f3f4f6" }}>
                    <b>{u.role}</b>
                  </td>
                  <td style={{ padding: 10, borderBottom: "1px solid #f3f4f6", color: "#6b7280" }}>
                    {u.createdAt ? new Date(u.createdAt).toLocaleString("pt-BR") : "-"}
                  </td>
                  <td style={{ padding: 10, borderBottom: "1px solid #f3f4f6", textAlign: "right" }}>
                    <button
                      onClick={() => resetPassword(u)}
                      disabled={!isAdmin}
                      style={{
                        padding: "8px 10px",
                        fontWeight: 900,
                        borderRadius: 8,
                        border: "1px solid #e5e7eb",
                        background: "white",
                        cursor: !isAdmin ? "not-allowed" : "pointer",
                        opacity: !isAdmin ? 0.6 : 1,
                        marginRight: 8
                      }}
                    >
                      Reset senha
                    </button>

                    <button
                      onClick={() => remove(u)}
                      disabled={!isAdmin}
                      style={{
                        padding: "8px 10px",
                        fontWeight: 900,
                        borderRadius: 8,
                        border: "1px solid #fecaca",
                        background: "#fee2e2",
                        color: "#991b1b",
                        cursor: !isAdmin ? "not-allowed" : "pointer",
                        opacity: !isAdmin ? 0.6 : 1
                      }}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 12, color: "#6b7280", fontSize: 12 }}>
        Segurança: somente ADMIN acessa esta tela. OPERADOR/CONSULTA não conseguem criar/resetar/excluir.
      </div>
    </div>
  );
}
