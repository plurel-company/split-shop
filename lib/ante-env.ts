/** Publishable-key parsing and user-facing Ante API error messages. */
export type AnteKeyMode = "sandbox" | "live" | null;

export function publishableKeyMode(key: string | undefined): AnteKeyMode {
  if (!key) return null;
  if (key.startsWith("ante_pk_test_")) return "sandbox";
  if (key.startsWith("ante_pk_live_")) return "live";
  return null;
}

export function anteEnvironmentFromKey(key: string): "sandbox" | "production" {
  return publishableKeyMode(key) === "live" ? "production" : "sandbox";
}

/** Dashboard shows a 16-char prefix — full keys are longer. */
export function looksLikeKeyPrefix(key: string): boolean {
  const trimmed = key.trim();
  return trimmed.length > 0 && trimmed.length <= 20;
}

/** Mirrors splitante.com API details[] for Invalid cart signature. */
export const INVALID_CART_SIGNATURE_HELP = [
  "Credential: use ANTE_SIGNING_SECRET (ante_sign_… from Developers → Signing), not ante_sk_… or whsec_….",
  "Value: paste the full secret into server env and redeploy. Dashboard rotation invalidates the old value immediately.",
  "Canonical JSON: sign with createCartSignature from @splitante/sdk/signing (≥0.1.10). Ante always includes fees: [] in the HMAC when the cart has no custom fees.",
  "Timing: re-sign at checkout click — cart edits after signing fail verification.",
] as const;

export function formatInvalidCartSignatureHelp(details?: string[]): string {
  const lines = details?.length ? details : [...INVALID_CART_SIGNATURE_HELP];
  return [
    "Cart signature rejected. This is not always a wrong secret — check each item:",
    ...lines.map((line) => `• ${line}`),
  ].join("\n");
}

export function explainAnteApiError(
  apiError: string,
  status?: number,
  details?: string[],
): string {
  const message = apiError.trim();
  if (!message) {
    return "Checkout failed — try Verify Ante credentials on this page.";
  }

  if (message.includes("Invalid cart signature")) {
    return formatInvalidCartSignatureHelp(details);
  }

  if (message.includes("Invalid or revoked API key") || message.includes("Invalid API key format")) {
    return "Publishable key is invalid or revoked. Paste the full key from the dashboard when it was created (not the prefix shown later).";
  }

  if (
    message.includes("Load failed") ||
    message.includes("Failed to fetch") ||
    message.includes("NetworkError")
  ) {
    return "Couldn't reach Ante's sandbox API — check your connection and try again.";
  }

  if (message.includes("Missing Authorization bearer")) {
    return "Publishable key missing in the browser — set NEXT_PUBLIC_ANTE_PUBLISHABLE_KEY and redeploy.";
  }

  if (message.includes("X-Merchant-ID does not match")) {
    return "Merchant ID does not match the publishable key. Use the ante_merch_* ID from the same merchant account.";
  }

  if (message.includes("does not match merchant mode")) {
    return "Key mode mismatch — use ante_pk_live_* for live merchants or ante_pk_test_* for sandbox merchants.";
  }

  if (message.includes("Cart total does not match") || message.includes("does not match subtotal")) {
    return `${message} Ensure cart.total includes tax, shipping, fees, and that line item unit_price values are in cents.`;
  }

  if (message.includes("Order total must be at least")) {
    return `${message} Add more items to your cart — this demo enforces the same minimum as your Ante merchant settings.`;
  }

  if (message.includes("Set up payouts") || message.includes("payout")) {
    return "Finish payout setup in the Ante merchant dashboard before accepting payments.";
  }

  if (message === "Unauthorized") {
    return "Ante accepted your key and signature but could not create the session (splitante.com internal auth). Set ANTE_INTERNAL_SECRET on splitante.com Vercel and Convex, then redeploy.";
  }

  if (message.includes("Service temporarily unavailable")) {
    return "Ante could not create the session right now. Common causes: payout setup incomplete, merchant not in live mode, or splitante.com backend error. Check the merchant dashboard, then retry Verify Ante credentials.";
  }

  if (status === 401) {
    return `Authentication failed (${message}). Confirm merchant ID, full publishable key, and signing secret are from the same Ante merchant.`;
  }

  return message;
}

export function validateCredentialShapes(input: {
  merchantId: string;
  publishableKey: string;
  signingSecret: string;
}): string[] {
  const issues: string[] = [];
  const { merchantId, publishableKey, signingSecret } = input;

  if (merchantId && !merchantId.startsWith("ante_merch_")) {
    issues.push("Merchant ID should start with ante_merch_.");
  }

  if (publishableKey && !publishableKeyMode(publishableKey)) {
    issues.push("Publishable key should start with ante_pk_test_ or ante_pk_live_.");
  }

  if (publishableKey && looksLikeKeyPrefix(publishableKey)) {
    issues.push(
      "Publishable key looks too short — paste the full key shown once at creation, not the dashboard prefix.",
    );
  }

  if (signingSecret && !signingSecret.startsWith("ante_sign_")) {
    issues.push("Signing secret should start with ante_sign_.");
  }

  if (signingSecret && looksLikeKeyPrefix(signingSecret)) {
    issues.push("Signing secret looks too short — copy the full ante_sign_* value from Developers → Signing.");
  }

  return issues;
}
