/** POST /api/client-log — dev-only checkout telemetry (disabled in production). */
export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return new Response(null, { status: 404 });
  }
  try {
    const body = (await request.json()) as Record<string, unknown>;
    console.error("[client-error]", JSON.stringify(body).slice(0, 2000));
  } catch {
    console.error("[client-error] unparseable payload");
  }
  return new Response(null, { status: 204 });
}
