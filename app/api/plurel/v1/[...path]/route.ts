/** Same-origin proxy for the Plurel Pay sessions API.
 *
 * Some devices block cross-site fetch outright — routing the SDK through this
 * same-origin path removes the cross-site request entirely; the forward to
 * plurelpay.com happens server-side.
 */
import {
  PLUREL_KEY_MODE_HEADER,
  parseCredentialModeFromRequest,
} from "@/lib/plurel-credential-mode";
import { PLUREL_API_BASE, buildUpstreamSessionHeaders } from "@/lib/plurel-upstream";

/** Only the session endpoints the storefront SDK actually uses. */
const ALLOWED_PATH = /^sessions(\/|$)?/;

type RouteParams = { params: Promise<{ path: string[] }> };

async function forward(request: Request, { params }: RouteParams) {
  const { path } = await params;
  const joined = (path ?? []).join("/");
  if (!ALLOWED_PATH.test(joined)) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const mode = parseCredentialModeFromRequest(request);

  let headers: Headers;
  try {
    headers = buildUpstreamSessionHeaders(mode, request);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Session API not configured";
    return Response.json({ error: message }, { status: 503 });
  }

  const search = new URL(request.url).search;
  const upstream = await fetch(`${PLUREL_API_BASE}/${joined}${search}`, {
    method: request.method,
    headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.text(),
    cache: "no-store",
  });

  return new Response(await upstream.text(), {
    status: upstream.status,
    headers: {
      "content-type": upstream.headers.get("content-type") ?? "application/json",
      "cache-control": "no-store",
    },
  });
}

export async function GET(request: Request, ctx: RouteParams) {
  return forward(request, ctx);
}

export async function POST(request: Request, ctx: RouteParams) {
  return forward(request, ctx);
}
