import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { listWebhookSecrets, verifyPlurelWebhookSignature } from "./plurel-webhook-verification";

describe("verifyPlurelWebhookSignature", () => {
  it("returns null when no secrets are configured", () => {
    const prev = process.env.PLUREL_WEBHOOK_SECRET_TEST;
    delete process.env.PLUREL_WEBHOOK_SECRET_TEST;
    delete process.env.PLUREL_WEBHOOK_SECRET_LIVE;
    delete process.env.PLUREL_WEBHOOK_SECRET;
    delete process.env.ANTE_WEBHOOK_SECRET_TEST;
    delete process.env.ANTE_WEBHOOK_SECRET_LIVE;
    delete process.env.ANTE_WEBHOOK_SECRET;

    assert.equal(listWebhookSecrets().length, 0);
    assert.equal(verifyPlurelWebhookSignature("{}", "v1=abc"), null);

    if (prev) process.env.PLUREL_WEBHOOK_SECRET_TEST = prev;
  });
});
