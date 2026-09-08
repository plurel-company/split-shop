import assert from "node:assert/strict";
import { createHmac, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

const databasePort = Number(process.env.SMOKE_DATABASE_PORT ?? 55433);
const workerPort = Number(process.env.SMOKE_WORKER_PORT ?? 8792);
const database = await PGlite.create();
const server = new PGLiteSocketServer({ db: database, host: "127.0.0.1", port: databasePort, maxConnections: 10 });
let worker;
let logs = "";
try {
  await database.exec(await readFile(new URL("../db/migrations/0001_orders.sql", import.meta.url), "utf8"));
  await server.start();
  worker = spawn("pnpm", ["exec", "wrangler", "dev", "--ip", "127.0.0.1", "--port", String(workerPort),
    "--var", "CLOUDFLARE_ENV:development",
    "--var", `DATABASE_URL:postgresql://postgres:postgres@127.0.0.1:${databasePort}/postgres`,
    "--var", "PLUREL_SIGNING_SECRET:plurel_sign_local_test",
    "--var", "PLUREL_WEBHOOK_SECRET_TEST:whsec_local_test"], { stdio: ["ignore", "pipe", "pipe"], detached: true });
  worker.stdout.on("data", (chunk) => { logs += chunk; });
  worker.stderr.on("data", (chunk) => { logs += chunk; });
  const origin = `http://127.0.0.1:${workerPort}`;
  const request = (path, init = {}) => fetch(origin + path, { ...init, signal: AbortSignal.timeout(10_000) });
  for (let attempt = 0; ; attempt++) {
    if (worker.exitCode !== null) throw new Error("Wrangler exited before becoming ready");
    try { if ((await request("/api/setup/status")).ok) break; } catch {}
    if (attempt >= 100) throw new Error("Worker did not become ready");
    await delay(100);
  }
  assert.equal((await request("/")).status, 200);
  assert.equal((await request("/products/mug.jpg")).status, 200);
  const orderRef = `ORD-${randomUUID()}`;
  const cart = { total: 5000, currency: "usd", items: [{ id: "sku", name: "Demo", quantity: 1, unit_price: 5000 }], metadata: { order_ref: orderRef } };
  const signed = await request("/api/cart/sign", { method: "POST", headers: { "content-type": "application/json", "x-plurel-key-mode": "sandbox" }, body: JSON.stringify({ cart, publishableKey: "plurel_pk_test_local_test" }) });
  assert.equal(signed.status, 200, await signed.clone().text());
  assert.equal(typeof (await signed.json()).signature, "string");
  const pending = await (await request(`/api/orders/${orderRef}`)).json();
  assert.equal(pending.status, "pending");
  assert.equal(pending.order.currency, "USD");
  const body = JSON.stringify({ id: "evt_local", type: "group.funded", data: { order_ref: orderRef, session_id: "sess_local", total: 5000 } });
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHmac("sha256", "whsec_local_test").update(`${timestamp}.${body}`).digest("hex");
  for (let delivery = 0; delivery < 2; delivery++) {
    const webhook = await request("/api/webhooks/plurelpay", { method: "POST", headers: { "content-type": "application/json", "plurel-signature": `t=${timestamp},v1=${signature}` }, body });
    assert.equal(webhook.status, 200, await webhook.clone().text());
    assert.equal((await webhook.json()).order.status, "funded");
  }
  const funded = await (await request(`/api/orders/${orderRef}`)).json();
  assert.equal(funded.status, "funded");
  assert.equal(funded.order.totalPaid, 5000);
  const invalid = await request("/api/webhooks/plurelpay", { method: "POST", headers: { "plurel-signature": `t=${timestamp},v1=invalid` }, body });
  assert.equal(invalid.status, 401);
  console.log("Workers smoke passed: static pages, pg persistence, signed webhook fulfillment, replay, invalid signature.");
} catch (error) {
  console.error(logs);
  throw error;
} finally {
  if (worker?.pid) {
    try { process.kill(-worker.pid, "SIGTERM"); } catch {}
  }
  await server.stop();
  await database.close();
}
