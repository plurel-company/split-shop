import { it } from "node:test";
import assert from "node:assert/strict";
import { DEMO_SCENARIOS, splitPreview } from "./demo-scenarios";
import { buildPlurelCart } from "./cart";
import { CURRENCY_ORDER } from "./currency";

it("every convention scenario produces a valid, balanced minor-unit split in each currency", () => {
  for (const scenario of DEMO_SCENARIOS) for (const currency of CURRENCY_ORDER) {
    const cart = buildPlurelCart(scenario.cart, "preview", currency);
    assert.ok(cart);
    const shares = splitPreview(cart.total, scenario.people);
    assert.equal(shares.length, scenario.people);
    assert.equal(shares.reduce((sum, share) => sum + share, 0), cart.total);
    assert.ok(Math.max(...shares) - Math.min(...shares) <= 1);
  }
});
it("split preview distributes remainders and rejects invalid inputs", () => {
  assert.deepEqual(splitPreview(100, 3), [34, 33, 33]);
  for (const [total, people] of [[-1, 4], [1.5, 2], [20, 0], [20, 7]]) assert.throws(() => splitPreview(total, people));
});
