import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHmac } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { handleDemoShopRequest } from "../dist/cloudflare-handler.mjs";

const database = await PGlite.create();
const port = Number(process.env.INTEGRATED_TEST_DATABASE_PORT ?? 55436);
const server = new PGLiteSocketServer({ db: database, host: "127.0.0.1", port, maxConnections: 10 });
const origin = "https://demo.example";
const env = { CLOUDFLARE_ENV: "development", DATABASE_URL: `postgresql://postgres:postgres@127.0.0.1:${port}/postgres`, DEMO_SHOP_MERCHANT_ID: "plurel_merch_test", DEMO_SHOP_PUBLISHABLE_KEY_TEST: "plurel_pk_test_demo", DEMO_SHOP_SECRET_KEY_TEST: "plurel_sk_test_demo", DEMO_SHOP_SIGNING_SECRET: "plurel_sign_test", DEMO_SHOP_WEBHOOK_SECRET_TEST: "whsec_test" };
const invoke = (path, init = {}, bindings = env, options) => handleDemoShopRequest(new Request(`${origin}/api/demo-shop${path}`, init), bindings, options);
const post = body => ({ method: "POST", headers: { "content-type": "application/json", origin }, body: JSON.stringify(body) });
try {
  await database.exec(await readFile(new URL("../db/migrations/0001_orders.sql", import.meta.url), "utf8"));
  await server.start();
  const html = await readFile(new URL("../dist/cloudflare-assets/demo/shop/index.html", import.meta.url), "utf8");
  assert.match(html, /Better together/);
  assert.match(html, /\/demo\/shop\/_next\//);
  assert.equal((await (await invoke("/setup/public", {}, {})).json()).ready, false);
  const config = await (await invoke("/setup/public")).json();
  assert.equal(config.ready, true);
  assert.deepEqual(Object.keys(config).sort(), ["merchantId", "publishableKey", "ready"]);
  assert.equal((await invoke("/setup/verify", post({}))).status, 404);
  assert.equal((await invoke("/cart/sign", { ...post({}), headers: { "content-type": "application/json", origin: "https://evil.example" } })).status, 403);
  assert.equal((await invoke("/cart/sign", { ...post({}), headers: { "content-type": "application/json", "x-plurel-key-mode": "live" } })).status, 403);
  assert.equal((await invoke("/cart/sign", { method: "POST", body: "{}" })).status, 415);
  assert.equal((await invoke("/cart/sign", post({ huge: "x".repeat(128 * 1024) }))).status, 413);
  const cart = { total: 5000, currency: "usd", items: [{ id: "test", name: "Demo", quantity: 1, unit_price: 5000 }], metadata: { order_ref: "ORD-integrated" } };
  assert.equal((await invoke("/cart/sign", post({ cart, publishableKey: "plurel_pk_live_demo" }))).status, 403);
  const signed = await invoke("/cart/sign", post({ cart, publishableKey: env.DEMO_SHOP_PUBLISHABLE_KEY_TEST }));
  assert.equal(signed.status, 200, await signed.clone().text());
  const stored = await (await invoke("/orders/ORD-integrated")).json();
  assert.equal(stored.status, "pending");
  const payload = JSON.stringify({ id: "event", type: "group.funded", data: { order_ref: "ORD-integrated", session_id: "session", total: 5000 } });
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHmac("sha256", env.DEMO_SHOP_WEBHOOK_SECRET_TEST).update(`${timestamp}.${payload}`).digest("hex");
  const delivery = { method: "POST", headers: { "plurel-signature": `t=${timestamp},v1=${signature}` }, body: payload };
  for (let attempt = 0; attempt < 2; attempt++) assert.equal((await invoke("/webhooks/plurelpay", delivery)).status, 200);
  const conflictingPayload = JSON.stringify({ type: "group.funded", data: { order_ref: "ORD-integrated", session_id: "different_session", total: 5000 } });
  const conflictingSignature = createHmac("sha256", env.DEMO_SHOP_WEBHOOK_SECRET_TEST).update(`${timestamp}.${conflictingPayload}`).digest("hex");
  const conflict = await invoke("/webhooks/plurelpay", { method: "POST", headers: { "plurel-signature": `t=${timestamp},v1=${conflictingSignature}` }, body: conflictingPayload });
  assert.equal(conflict.status, 409);
  assert.equal((await (await invoke("/orders/ORD-integrated")).json()).order.sessionId, "session");
  assert.equal((await (await invoke("/orders/ORD-integrated")).json()).status, "funded");
  // A live key from the parent application's environment must never be used.
  const isolated = await invoke("/plurel/v1/sessions", post({}), { PLUREL_SECRET_KEY: "plurel_sk_live_parent" }, { fetchApi: () => { throw new Error("Unexpected dispatch"); } });
  assert.equal(isolated.status, 503);
  const seen = [];
  await Promise.all(["first", "second"].map(id => invoke("/plurel/v1/sessions", post({}), { ...env, DEMO_SHOP_MERCHANT_ID: id }, { fetchApi: async request => {
    await new Promise(resolve => setTimeout(resolve, id === "first" ? 10 : 0));
    assert.equal(new URL(request.url).pathname, "/api/v1/sessions");
    assert.equal(request.headers.get("authorization"), `Bearer ${env.DEMO_SHOP_SECRET_KEY_TEST}`);
    seen.push(request.headers.get("x-merchant-id"));
    return Response.json({ session_id: `session_${id}`, expires_at: new Date(Date.now() + 3600_000).toISOString(), environment: "sandbox" });
  } })));
  assert.deepEqual(seen.sort(), ["first", "second"]);
  assert.equal((await invoke("/plurel/v1/sessions-evil", post({}))).status, 404);
  const calls = [];
  const sandbox = { session_id: "session_owner", environment: "sandbox", expires_at: new Date(Date.now() + 3600_000).toISOString(), status: "pending", group: { members: [{ name: "Owner" }] } };
  let returnedEnvironment = "sandbox";
  const upstream = { fetchApi: async request => {
    calls.push(`${request.method} ${new URL(request.url).pathname}`);
    return Response.json({ ...sandbox, environment: returnedEnvironment });
  } };
  const created = await invoke("/plurel/v1/sessions", post({}), env, upstream);
  assert.equal(created.status, 200);
  const cookie = created.headers.get("set-cookie").split(";")[0];
  assert.match(created.headers.get("set-cookie"), /HttpOnly; SameSite=Strict;/);
  const authenticated = { headers: { cookie } };
  const noDispatch = { fetchApi: () => { throw new Error("Unauthorized upstream call"); } };
  const blocked = [
    ["/plurel/v1/sessions", {}],
    ["/plurel/v1/sessions/session_owner", {}],
    ["/plurel/v1/sessions/session_other", authenticated],
    ["/plurel/v1/sessions/session_owner", { headers: { cookie: cookie + "x" } }],
    ["/plurel/v1/sessions/session_owner/cancel", post({})],
  ];
  for (const [path, init] of blocked) {
    const response = await invoke(path, init, env, noDispatch);
    assert.ok([403, 404].includes(response.status), `${path}: ${response.status}`);
  }
  const owned = await invoke("/plurel/v1/sessions/session_owner", authenticated, env, upstream);
  assert.equal(owned.status, 200);
  assert.equal((await owned.json()).group.members[0].name, "Owner");
  const cancelRequest = { ...post({}), headers: { ...post({}).headers, cookie } };
  const cancelled = await invoke("/plurel/v1/sessions/session_owner/cancel", cancelRequest, env, upstream);
  assert.equal(cancelled.status, 200);
  assert.deepEqual(calls.slice(-2), ["GET /api/v1/sessions/session_owner", "POST /api/v1/sessions/session_owner/cancel"]);
  returnedEnvironment = "live";
  const callsBeforeLive = calls.length;
  for (const [path, init] of [["/plurel/v1/sessions/session_owner", authenticated], ["/plurel/v1/sessions/session_owner/cancel", cancelRequest]]) {
    const response = await invoke(path, init, env, upstream);
    assert.equal(response.status, 403);
    assert.doesNotMatch(await response.text(), /Owner/);
  }
  assert.ok(calls.slice(callsBeforeLive).every(call => call.startsWith("GET ")));
  const liveCreate = await invoke("/plurel/v1/sessions", post({}), env, upstream);
  assert.equal(liveCreate.status, 502);
  assert.equal(liveCreate.headers.get("set-cookie"), null);
  assert.doesNotMatch(await liveCreate.text(), /session_owner/);

  console.log("Integrated demo passed: static mount, public readiness, sandbox isolation, CSRF/body guards, PostgreSQL signing + webhook replay, concurrent internal API dispatch.");
} finally { await server.stop(); await database.close(); }
