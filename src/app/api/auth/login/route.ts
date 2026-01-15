export async function POST() {
  return Response.json({
    error: "Login ainda não conectado ao banco. Próximo passo: conectar Postgres e Prisma."
  }, { status: 401 });
}
