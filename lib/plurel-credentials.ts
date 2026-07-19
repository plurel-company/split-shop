/** Server-only Plurel Pay credential resolution and webhook verification. */
import "server-only";

import type { PlurelCredentialMode } from "@/lib/plurel-credential-mode";
import { readEnv } from "@/lib/read-env";

export type { PlurelCredentialMode, AnteCredentialMode } from "@/lib/plurel-credential-mode";
export {
  PLUREL_KEY_MODE_HEADER,
  ANTE_KEY_MODE_HEADER,
  keyModeMatches,
  modeLabel,
  parsePlurelCredentialMode,
  parseAnteCredentialMode,
  parseCredentialModeFromRequest,
} from "@/lib/plurel-credential-mode";

export {
  listWebhookSecrets,
  verifyPlurelWebhookSignature,
  verifyAnteWebhookSignature,
} from "@/lib/plurel-webhook-verification";

export function resolvePublishableKey(mode: PlurelCredentialMode): string {
  if (mode === "live") {
    return (
      readEnv("NEXT_PUBLIC_PLUREL_PUBLISHABLE_KEY_LIVE", "NEXT_PUBLIC_ANTE_PUBLISHABLE_KEY_LIVE") ||
      readEnv("NEXT_PUBLIC_PLUREL_PUBLISHABLE_KEY", "NEXT_PUBLIC_ANTE_PUBLISHABLE_KEY")
    );
  }

  return readEnv(
    "NEXT_PUBLIC_PLUREL_PUBLISHABLE_KEY_TEST",
    "NEXT_PUBLIC_ANTE_PUBLISHABLE_KEY_TEST",
  );
}

export function resolveSecretKey(mode: PlurelCredentialMode): string {
  if (mode === "live") {
    return (
      readEnv("PLUREL_SECRET_KEY_LIVE", "ANTE_SECRET_KEY_LIVE") ||
      readEnv("PLUREL_SECRET_KEY", "ANTE_SECRET_KEY")
    );
  }

  return readEnv("PLUREL_SECRET_KEY_TEST", "ANTE_SECRET_KEY_TEST");
}

export function resolveWebhookSecret(mode: PlurelCredentialMode): string {
  if (mode === "live") {
    return (
      readEnv("PLUREL_WEBHOOK_SECRET_LIVE", "ANTE_WEBHOOK_SECRET_LIVE") ||
      readEnv("PLUREL_WEBHOOK_SECRET", "ANTE_WEBHOOK_SECRET")
    );
  }
  return readEnv("PLUREL_WEBHOOK_SECRET_TEST", "ANTE_WEBHOOK_SECRET_TEST");
}

export function merchantId(): string {
  return readEnv("NEXT_PUBLIC_PLUREL_MERCHANT_ID", "NEXT_PUBLIC_ANTE_MERCHANT_ID");
}

export function signingSecret(): string {
  return readEnv("PLUREL_SIGNING_SECRET", "ANTE_SIGNING_SECRET");
}

export function credentialAvailability(): {
  merchantId: boolean;
  testKey: boolean;
  liveKey: boolean;
  testSecretKey: boolean;
  liveSecretKey: boolean;
  signingSecret: boolean;
  webhookTest: boolean;
  webhookLive: boolean;
} {
  return {
    merchantId: Boolean(merchantId()),
    testKey: Boolean(
      readEnv("NEXT_PUBLIC_PLUREL_PUBLISHABLE_KEY_TEST", "NEXT_PUBLIC_ANTE_PUBLISHABLE_KEY_TEST"),
    ),
    liveKey: Boolean(
      readEnv("NEXT_PUBLIC_PLUREL_PUBLISHABLE_KEY_LIVE", "NEXT_PUBLIC_ANTE_PUBLISHABLE_KEY_LIVE") ||
        readEnv("NEXT_PUBLIC_PLUREL_PUBLISHABLE_KEY", "NEXT_PUBLIC_ANTE_PUBLISHABLE_KEY"),
    ),
    testSecretKey: Boolean(readEnv("PLUREL_SECRET_KEY_TEST", "ANTE_SECRET_KEY_TEST")),
    liveSecretKey: Boolean(
      readEnv("PLUREL_SECRET_KEY_LIVE", "ANTE_SECRET_KEY_LIVE") ||
        readEnv("PLUREL_SECRET_KEY", "ANTE_SECRET_KEY"),
    ),
    signingSecret: Boolean(signingSecret()),
    webhookTest: Boolean(readEnv("PLUREL_WEBHOOK_SECRET_TEST", "ANTE_WEBHOOK_SECRET_TEST")),
    webhookLive: Boolean(
      readEnv("PLUREL_WEBHOOK_SECRET_LIVE", "ANTE_WEBHOOK_SECRET_LIVE") ||
        readEnv("PLUREL_WEBHOOK_SECRET", "ANTE_WEBHOOK_SECRET"),
    ),
  };
}
