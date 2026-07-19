/** GET /api/setup/status — report env configuration for the active test/live mode. */
import {
  credentialAvailability,
  merchantId,
  parseCredentialModeFromRequest,
  resolvePublishableKey,
  resolveSecretKey,
  resolveWebhookSecret,
  signingSecret,
} from "@/lib/plurel-credentials";
import { publishableKeyMode, validateCredentialShapes } from "@/lib/plurel-env";

export async function GET(req: Request) {
  const mode = parseCredentialModeFromRequest(req);
  const id = merchantId();
  const publishableKey = resolvePublishableKey(mode);
  const secret = signingSecret();
  const secretKey = resolveSecretKey(mode);
  const webhookSecret = resolveWebhookSecret(mode);
  const keyMode = publishableKeyMode(publishableKey);
  const availability = credentialAvailability();

  const issues: string[] = validateCredentialShapes({
    merchantId: id,
    publishableKey,
    signingSecret: secret,
  });

  if (!id) {
    issues.push("Set NEXT_PUBLIC_PLUREL_MERCHANT_ID (or NEXT_PUBLIC_ANTE_MERCHANT_ID) — plurel_merch_… from the dashboard.");
  }
  if (!publishableKey) {
    issues.push(
      mode === "live"
        ? "Set NEXT_PUBLIC_PLUREL_PUBLISHABLE_KEY (or NEXT_PUBLIC_ANTE_PUBLISHABLE_KEY) — plurel_pk_live_*."
        : "Set NEXT_PUBLIC_PLUREL_PUBLISHABLE_KEY_TEST (or NEXT_PUBLIC_ANTE_PUBLISHABLE_KEY_TEST) — plurel_pk_test_*.",
    );
  }
  if (!secret) {
    issues.push(
      "Set PLUREL_SIGNING_SECRET (or ANTE_SIGNING_SECRET) on the server (Developers → Signing). Without it, checkout cannot sign carts.",
    );
  }
  if (!secretKey) {
    issues.push(
      mode === "live"
        ? "Set PLUREL_SECRET_KEY (or ANTE_SECRET_KEY) — plurel_sk_live_* on the server. Session create requires payments:write."
        : "Set PLUREL_SECRET_KEY_TEST (or ANTE_SECRET_KEY_TEST) — plurel_sk_test_* on the server. Session create requires payments:write.",
    );
  }
  if (!webhookSecret) {
    issues.push(
      mode === "live"
        ? "Optional: set PLUREL_WEBHOOK_SECRET (or ANTE_WEBHOOK_SECRET) — whsec_… for live group.funded events."
        : "Optional: set PLUREL_WEBHOOK_SECRET_TEST (or ANTE_WEBHOOK_SECRET_TEST) — whsec_… for test webhooks.",
    );
  }

  return Response.json({
    ok: issues.length === 0,
    mode,
    merchantId: Boolean(id),
    publishableKey: Boolean(publishableKey),
    publishableKeyMode: keyMode,
    publishableKeyLength: publishableKey.length,
    signingSecret: Boolean(secret),
    secretKey: Boolean(secretKey),
    webhookSecret: Boolean(webhookSecret),
    testKey: availability.testKey,
    liveKey: availability.liveKey,
    issues,
  });
}
