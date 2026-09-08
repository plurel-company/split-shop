import assert from "node:assert/strict";
import { before, after, beforeEach, describe, it } from "node:test";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { fulfillGroupFunded } from "./webhook-fulfillment";
import { createPostgresOrderStore, OrderConflictError, type PendingOrder, type OrderRecord } from "./order-store";

const database = new PGlite();
const store = createPostgresOrderStore((sql, parameters) => database.query<{ record: OrderRecord }>(sql, parameters));
const order: PendingOrder = {
  orderRef: "ord_test", currency: "USD", lines: [{ id: "sku_1", name: "Demo", quantity: 1, unit_price: 5000 }],
  subtotal: 5000, tax: 0, shipping: 0, total: 5000, createdAt: 100, credentialMode: "sandbox",
};
const event = { type: "group.funded", data: { order_ref: order.orderRef, session_id: "sess_1", total: 5000 } };

before(async () => {
  await database.exec(await readFile(new URL("../db/migrations/0001_orders.sql", import.meta.url), "utf8"));
});
after(async () => database.close());
beforeEach(async () => { await database.exec("DELETE FROM split_shop_orders"); });

describe("Postgres order fulfillment", () => {
  it("rejects mismatched modes and underpayments without modifying the order", async () => {
    await store.registerPendingOrder(order);
    assert.deepEqual(await fulfillGroupFunded(event, "live", store), { ok: false, status: 401, error: "Webhook credential mode mismatch" });
    assert.deepEqual(await fulfillGroupFunded({ ...event, data: { ...event.data, total: 4999 } }, "sandbox", store), { ok: false, status: 400, error: "Funded total is below order amount" });
    assert.equal((await store.getOrder(order.orderRef))?.status, "pending");
  });

  it("persists across independent store clients and handles concurrent duplicate deliveries", async () => {
    await store.registerPendingOrder(order);
    const other = createPostgresOrderStore((sql, parameters) => database.query<{ record: OrderRecord }>(sql, parameters));
    assert.equal((await other.getOrder(order.orderRef))?.status, "pending");
    const results = await Promise.all([fulfillGroupFunded(event, "sandbox", store), fulfillGroupFunded(event, "sandbox", other)]);
    assert.ok(results.every((result) => result.ok));
    assert.equal(results.filter((result) => result.ok && !result.duplicate).length, 1);
    assert.equal(results.filter((result) => result.ok && result.duplicate).length, 1);
    assert.equal((await other.getOrder(order.orderRef))?.status, "funded");
  });

  it("reuses identical pending carts but refuses changed or funded order refs", async () => {
    await store.registerPendingOrder(order);
    await store.registerPendingOrder({ ...order, createdAt: 200 });
    await assert.rejects(store.registerPendingOrder({ ...order, total: 1 }), OrderConflictError);
    await fulfillGroupFunded(event, "sandbox", store);
    await assert.rejects(store.registerPendingOrder(order), OrderConflictError);
  });

  it("verifies credentials even for a funded order replay and preserves the signed total", async () => {
    await store.registerPendingOrder(order);
    await fulfillGroupFunded({ ...event, data: { ...event.data, total: 6000 } }, "sandbox", store);
    const funded = await store.getOrder(order.orderRef);
    assert.equal(funded?.total, 5000);
    assert.equal(funded?.status === "funded" && funded.totalPaid, 6000);
    assert.equal((await fulfillGroupFunded(event, "live", store)).ok, false);
  });

  it("rejects unknown order refs, fractional payments and missing metadata", async () => {
    assert.deepEqual(await fulfillGroupFunded(event, "sandbox", store), { ok: false, status: 404, error: "Unknown order_ref" });
    assert.equal((await fulfillGroupFunded({ ...event, data: { ...event.data, total: 5000.5 } }, "sandbox", store)).ok, false);
    assert.equal((await fulfillGroupFunded({ ...event, data: { total: 5000 } }, "sandbox", store)).ok, false);
  });
});
