/** Server/client env resolution for test vs live Ante credentials. */
import { verifyWebhookSignature } from "@splitante/sdk/signing";

import { publishableKeyMode } from "@/lib/ante-env";

export type AnteCredentialMode = "sandbox" | "live";

export const ANTE_KEY_MODE_HEADER = "x-ante-key-mode";

export function parseAnteCredentialMode(value: string | null | undefined): AnteCredentialMode {
  return value?.toLowerCase() === "live" ? "live" : "sandbox";
}

/** Unqualified env vars (no _TEST suffix) are the live credentials — matches typical Vercel setup. */
export function resolvePublishableKey(mode: AnteCredentialMode): string {
  if (mode === "live") {
    return (
      process.env.NEXT_PUBLIC_ANTE_PUBLISHABLE_KEY_LIVE?.trim() ||
      process.env.NEXT_PUBLIC_ANTE_PUBLISHABLE_KEY?.trim() ||
      ""
    );
  }

  return process.env.NEXT_PUBLIC_ANTE_PUBLISHABLE_KEY_TEST?.trim() || "";
}

export function resolveWebhookSecret(mode: AnteCredentialMode): string {
  if (mode === "live") {
    return (
      process.env.ANTE_WEBHOOK_SECRET_LIVE?.trim() || process.env.ANTE_WEBHOOK_SECRET?.trim() || ""
    );
  }
  return process.env.ANTE_WEBHOOK_SECRET_TEST?.trim() || "";
}

/** All configured webhook secrets — used when inbound webhooks have no mode header. */
export function listWebhookSecrets(): string[] {
  const secrets = new Set<string>();
  for (const value of [
    process.env.ANTE_WEBHOOK_SECRET_TEST,
    process.env.ANTE_WEBHOOK_SECRET_LIVE,
    process.env.ANTE_WEBHOOK_SECRET,
  ]) {
    const trimmed = value?.trim();
    if (trimmed) secrets.add(trimmed);
  }
  return [...secrets];
}

/** Verify signature against every configured secret — do not trust x-ante-key-mode for auth. */
export function verifyAnteWebhookSignature(rawBody: string, signatureHeader: string): boolean {
  const secrets = listWebhookSecrets();
  if (secrets.length === 0) return false;
  return secrets.some((secret) => verifyWebhookSignature(rawBody, secret, signatureHeader));
}

export function merchantId(): string {
  return process.env.NEXT_PUBLIC_ANTE_MERCHANT_ID?.trim() ?? "";
}

/** Shared signing secret — same value for test and live checkout on one merchant. */
export function signingSecret(): string {
  return process.env.ANTE_SIGNING_SECRET?.trim() ?? "";
}

export function credentialAvailability(): {
  merchantId: boolean;
  testKey: boolean;
  liveKey: boolean;
  signingSecret: boolean;
  webhookTest: boolean;
  webhookLive: boolean;
} {
  return {
    merchantId: Boolean(merchantId()),
    testKey: Boolean(process.env.NEXT_PUBLIC_ANTE_PUBLISHABLE_KEY_TEST?.trim()),
    liveKey: Boolean(
      process.env.NEXT_PUBLIC_ANTE_PUBLISHABLE_KEY_LIVE?.trim() ||
        process.env.NEXT_PUBLIC_ANTE_PUBLISHABLE_KEY?.trim(),
    ),
    signingSecret: Boolean(signingSecret()),
    webhookTest: Boolean(process.env.ANTE_WEBHOOK_SECRET_TEST?.trim()),
    webhookLive: Boolean(
      process.env.ANTE_WEBHOOK_SECRET_LIVE?.trim() || process.env.ANTE_WEBHOOK_SECRET?.trim(),
    ),
  };
}

export function modeLabel(mode: AnteCredentialMode): string {
  return mode === "live" ? "Live" : "Test";
}

export function keyModeMatches(mode: AnteCredentialMode, key: string): boolean {
  const detected = publishableKeyMode(key);
  if (!detected) return true;
  return mode === "live" ? detected === "live" : detected === "sandbox";
}
