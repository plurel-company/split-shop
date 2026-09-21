import handler from "./.open-next/worker.js";

const APEX = "splitshop.dev";
const WWW = "www.splitshop.dev";

export default {
  fetch(request: Request, env: unknown, context: { waitUntil(promise: Promise<unknown>): void }) {
    const url = new URL(request.url);
    if (url.hostname.toLowerCase() === WWW) {
      url.hostname = APEX;
      return Response.redirect(url.toString(), 308);
    }
    return handler.fetch(request, env, context);
  },
};
