import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import { fulfillGroupFunded } from "./webhook-fulfillment";
import { getOrder, registerPendingOrder } from "./order-store";

const STORE_KEY = "__plurel_demo_order_store__";

function resetOrderStore(): void {
  const globalStore = globalThis as typeof globalThis & {
    [STORE_KEY]?: { pending: Map<string, unknown>; funded: Map<string, unknown> };
  };
  delete globalStore[STORE_KEY];
}

describe("fulfillGroupFunded", () => {
  afterEach(() => {
    resetOrderStore();
  });

  it("rejects fulfillment when webhook secret mode does not match pending order mode", () => {
    registerPendingOrder({
      orderRef: "ord_mode_mismatch",
      lines: [{ id: "sku_1", name: "Demo", quantity: 1, unit_price: 5000 }],
      subtotal: 5000,
      tax: 0,
      shipping: 0,
      total: 5000,
      createdAt: Date.now(),
      credentialMode: "sandbox",
    });

    const result = fulfillGroupFunded(
      {
        type: "group.funded",
        data: {
          order_ref: "ord_mode_mismatch",
          session_id: "sess_1",
          total: 5000,
        },
      },
      "live",
    );

    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.status, 401);
    assert.equal(result.error, "Webhook credential mode mismatch");
    assert.equal(getOrder("ord_mode_mismatch")?.status, "pending");
  });
});
