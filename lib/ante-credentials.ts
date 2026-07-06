/** Server-only Ante credential resolution and webhook verification. */
import "server-only";

import type { AnteCredentialMode } from "@/lib/ante-credential-mode";

export type { AnteCredentialMode } from "@/lib/ante-credential-mode";
export {
  ANTE_KEY_MODE_HEADER,
  keyModeMatches,
  modeLabel,
  parseAnteCredentialMode,
} from "@/lib/ante-credential-mode";

export { listWebhookSecrets, verifyAnteWebhookSignature } from "@/lib/ante-webhook-verification";

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
