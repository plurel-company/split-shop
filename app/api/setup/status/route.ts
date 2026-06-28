import { publishableKeyMode, validateCredentialShapes } from "@/lib/ante-env";

export async function GET() {
  const merchantId = process.env.NEXT_PUBLIC_ANTE_MERCHANT_ID?.trim() ?? "";
  const publishableKey = process.env.NEXT_PUBLIC_ANTE_PUBLISHABLE_KEY?.trim() ?? "";
  const signingSecret = process.env.ANTE_SIGNING_SECRET?.trim() ?? "";
  const webhookSecret = process.env.ANTE_WEBHOOK_SECRET?.trim() ?? "";
  const keyMode = publishableKeyMode(publishableKey);

  const issues: string[] = validateCredentialShapes({
    merchantId,
    publishableKey,
    signingSecret,
  });

  if (!merchantId) {
    issues.push("Set NEXT_PUBLIC_ANTE_MERCHANT_ID (ante_merch_… from the dashboard).");
  }
  if (!publishableKey) {
    issues.push("Set NEXT_PUBLIC_ANTE_PUBLISHABLE_KEY (ante_pk_test_* or ante_pk_live_*).");
  }
  if (!signingSecret) {
    issues.push(
      "Set ANTE_SIGNING_SECRET on the server (Developers → Signing). Without it, checkout cannot sign carts.",
    );
  }
  if (!webhookSecret) {
    issues.push("Optional: set ANTE_WEBHOOK_SECRET (whsec_…) to receive group.funded events.");
  }

  return Response.json({
    ok: issues.length === 0,
    merchantId: Boolean(merchantId),
    publishableKey: Boolean(publishableKey),
    publishableKeyMode: keyMode,
    publishableKeyLength: publishableKey.length,
    signingSecret: Boolean(signingSecret),
    webhookSecret: Boolean(webhookSecret),
    issues,
  });
}
