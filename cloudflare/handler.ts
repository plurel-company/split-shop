import { withDemoRuntime, type DemoShopEnv, type DemoShopOptions } from "../lib/demo-runtime";
import { GET as publicConfig } from "../app/api/setup/public/route";
import { POST as signCart } from "../app/api/cart/sign/route";
import { GET as getOrder } from "../app/api/orders/[orderRef]/route";
import { GET as getSession, POST as postSession } from "../app/api/plurel/v1/[...path]/route";
import { POST as webhook } from "../app/api/webhooks/plurelpay/route";
export type { DemoShopEnv, DemoShopOptions } from "../lib/demo-runtime";

const PREFIX = "/api/demo-shop";
const MAX_BODY_BYTES = 128 * 1024;
const json = (error: string, status: number) => Response.json({ error }, { status, headers: { "cache-control": "no-store" } });

/** A sandbox storefront service mounted inside the main PlurelPay Worker. */
export async function handleDemoShopRequest(request: Request, env: DemoShopEnv, options: DemoShopOptions = {}): Promise<Response> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith(`${PREFIX}/`)) return json("Not found", 404);
  const path = url.pathname.slice(PREFIX.length);
  const isWebhook = path === "/webhooks/plurelpay";
  if (!["GET", "POST"].includes(request.method)) return json("Method not allowed", 405);
  if ((request.headers.get("x-plurel-key-mode") ?? "sandbox") !== "sandbox" ||
      (request.headers.get("x-ante-key-mode") ?? "sandbox") !== "sandbox") return json("This demonstration accepts sandbox requests only.", 403);
  if (request.method === "POST" && !isWebhook) {
    const origin = request.headers.get("origin");
    if ((origin && origin !== url.origin) || request.headers.get("sec-fetch-site") === "cross-site") return json("Origin not allowed", 403);
    if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return json("Expected application/json", 415);
  }
  if (request.method === "POST") {
    const reader = request.body?.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    if (reader) while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) { await reader.cancel(); return json("Request body is too large", 413); }
      chunks.push(value);
    }
    const body = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.length; }
    request = new Request(request.url, { method: request.method, headers: request.headers, body });
  }
  return withDemoRuntime(env, url.origin, options, async () => {
    try {
      let response: Response;
      if (path === "/setup/public" && request.method === "GET") response = await publicConfig();
      else if (path === "/cart/sign" && request.method === "POST") response = await signCart(request);
      else if (isWebhook && request.method === "POST") response = await webhook(request);
      else if (/^\/orders\/[A-Za-z0-9_-]{1,160}$/.test(path) && request.method === "GET") {
        response = await getOrder(request, { params: Promise.resolve({ orderRef: path.split("/")[2]! }) });
      } else if (path.startsWith("/plurel/v1/")) {
        const params = Promise.resolve({ path: path.slice("/plurel/v1/".length).split("/") });
        response = await (request.method === "GET" ? getSession : postSession)(request, { params });
      } else return json("Not found", 404);
      const headers = new Headers(response.headers);
      headers.set("cache-control", "no-store");
      headers.set("x-content-type-options", "nosniff");
      return new Response(response.body, { status: response.status, headers });
    } catch {
      return json("The sandbox service is unavailable. Please try again shortly.", 503);
    }
  });
}
