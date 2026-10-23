/** Static visual preview only. Deliberately has no payment, database or upstream handler. */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const headers = { "X-Robots-Tag": "noindex, nofollow, noarchive", "Cache-Control": "no-store" };
    if (url.pathname === "/api/setup/public" && request.method === "GET") {
      return Response.json({ merchantId: "", publishableKey: "", ready: false }, { headers });
    }
    if (url.pathname === "/api" || url.pathname.startsWith("/api/")) {
      return Response.json({ error: "Checkout is disconnected in this visual preview." }, { status: 503, headers });
    }
    if (!["GET", "HEAD"].includes(request.method)) {
      return new Response("Method not allowed", { status: 405, headers: { ...headers, Allow: "GET, HEAD" } });
    }
    const asset = await env.ASSETS.fetch(request);
    const response = new Response(asset.body, asset);
    response.headers.set("X-Robots-Tag", headers["X-Robots-Tag"]);
    return response;
  },
};
