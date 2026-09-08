/** Sandbox SDK proxy. Merchant credentials are never a public read/cancel authority. */
import { parseCredentialModeFromRequest } from "@/lib/plurel-credential-mode";
import { fetchPlurelApi, buildUpstreamSessionHeaders } from "@/lib/plurel-upstream";
import { merchantId, signingSecret } from "@/lib/plurel-credentials";
import { issueSessionCapability, hasSessionCapability } from "@/lib/session-capability";

type RouteParams = { params: Promise<{ path: string[] }> };
const failure = (error: string, status: number) => Response.json({ error }, { status, headers: { "cache-control": "no-store" } });
const sandboxSession = (value: unknown, expectedId?: string): value is { session_id: string; expires_at: string; environment: "sandbox" } => {
  if (!value || typeof value !== "object") return false;
  const data = value as Record<string, unknown>;
  return data.environment === "sandbox" && typeof data.session_id === "string" &&
    /^[A-Za-z0-9_-]{1,160}$/.test(data.session_id) && (!expectedId || data.session_id === expectedId);
};

async function forward(request: Request, { params }: RouteParams) {
  const { path } = await params;
  const create = request.method === "POST" && path.length === 1 && path[0] === "sessions";
  const sessionId = path[1];
  const read = request.method === "GET" && path.length === 2;
  const cancel = request.method === "POST" && path.length === 3 && path[2] === "cancel";
  // Listing and all other merchant operations have no place in a public storefront.
  if (!create && !(path[0] === "sessions" && sessionId && /^[A-Za-z0-9_-]{1,160}$/.test(sessionId) && (read || cancel))) return failure("Not found", 404);
  const url = new URL(request.url);
  const origin = request.headers.get("origin");
  if ((origin && origin !== url.origin) || request.headers.get("sec-fetch-site") === "cross-site") return failure("Origin not allowed", 403);
  if (request.method === "POST" && !request.headers.get("content-type")?.startsWith("application/json")) return failure("Expected application/json", 415);
  if (parseCredentialModeFromRequest(request) !== "sandbox") return failure("Sandbox requests only", 403);
  const secret = signingSecret();
  const id = merchantId();
  if (!secret || !id) return failure("Sandbox checkout is not configured", 503);
  if (!create && !hasSessionCapability(request, sessionId!, secret, id)) return failure("Session access denied", 403);
  let headers: Headers;
  try { headers = buildUpstreamSessionHeaders("sandbox", request); }
  catch { return failure("Sandbox checkout is not configured", 503); }

  if (!create) {
    // Recheck the stored session's environment before returning data or allowing cancellation.
    const status = await fetchPlurelApi(`/sessions/${sessionId}`, { method: "GET", headers, cache: "no-store" });
    const data: unknown = await status.json().catch(() => null);
    if (!status.ok) return failure("Session is unavailable", status.status >= 500 ? 503 : 404);
    if (!sandboxSession(data, sessionId)) return failure("Session access denied", 403);
    if (read) return Response.json(data, { headers: { "cache-control": "no-store" } });
  }

  const upstream = await fetchPlurelApi(create ? "/sessions" : `/sessions/${sessionId}/cancel`, {
    method: "POST", headers, body: await request.text(), cache: "no-store",
  });
  const data: unknown = await upstream.json().catch(() => null);
  if (!upstream.ok) return Response.json(data ?? { error: "Sandbox request failed" }, { status: upstream.status, headers: { "cache-control": "no-store" } });
  const responseHeaders = new Headers({ "cache-control": "no-store" });
  if (create) {
    if (!sandboxSession(data)) return failure("Sandbox session could not be verified", 502);
    const cookie = issueSessionCapability(request, data.session_id, data.expires_at, secret, id);
    if (!cookie) return failure("Sandbox session could not be verified", 502);
    responseHeaders.set("set-cookie", cookie);
  }
  return Response.json(data, { status: upstream.status, headers: responseHeaders });
}
export async function GET(request: Request, ctx: RouteParams) { return forward(request, ctx); }
export async function POST(request: Request, ctx: RouteParams) { return forward(request, ctx); }
