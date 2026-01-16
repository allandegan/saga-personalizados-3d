export async function GET() {
  return Response.json({
    ok: true,
    message: "PING V2",
    at: new Date().toISOString()
  });
}
