/** Server-only Plurel Pay credential resolution and webhook verification. */
import "server-only";

import type { PlurelCredentialMode } from "@/lib/plurel-credential-mode";
import { readEnv } from "@/lib/read-env";

export type { PlurelCredentialMode } from "@/lib/plurel-credential-mode";
export {
  PLUREL_KEY_MODE_HEADER,
  keyModeMatches,
  modeLabel,
  parsePlurelCredentialMode,
  parseCredentialModeFromRequest,
} from "@/lib/plurel-credential-mode";

export {
  listWebhookSecrets,
  verifyPlurelWebhookSignature,
} from "@/lib/plurel-webhook-verification";

export function resolvePublishableKey(mode: PlurelCredentialMode): string {
  if (mode === "live") {
    return (
      readEnv("NEXT_PUBLIC_PLUREL_PUBLISHABLE_KEY_LIVE") ||
      readEnv("NEXT_PUBLIC_PLUREL_PUBLISHABLE_KEY")
    );
  }

  return readEnv("NEXT_PUBLIC_PLUREL_PUBLISHABLE_KEY_TEST", "DEMO_SHOP_PUBLISHABLE_KEY_TEST");
}

export function resolveSecretKey(mode: PlurelCredentialMode): string {
  if (mode === "live") {
    return readEnv("PLUREL_SECRET_KEY_LIVE") || readEnv("PLUREL_SECRET_KEY");
  }

  return readEnv("PLUREL_SECRET_KEY_TEST", "DEMO_SHOP_SECRET_KEY_TEST");
}

export function resolveWebhookSecret(mode: PlurelCredentialMode): string {
  if (mode === "live") {
    return readEnv("PLUREL_WEBHOOK_SECRET_LIVE") || readEnv("PLUREL_WEBHOOK_SECRET");
  }
  return readEnv("PLUREL_WEBHOOK_SECRET_TEST", "DEMO_SHOP_WEBHOOK_SECRET_TEST");
}

export function merchantId(): string {
  return readEnv("NEXT_PUBLIC_PLUREL_MERCHANT_ID", "DEMO_SHOP_MERCHANT_ID");
}

export function signingSecret(): string {
  return readEnv("PLUREL_SIGNING_SECRET", "DEMO_SHOP_SIGNING_SECRET");
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
    testKey: Boolean(readEnv("NEXT_PUBLIC_PLUREL_PUBLISHABLE_KEY_TEST")),
    liveKey: Boolean(
      readEnv("NEXT_PUBLIC_PLUREL_PUBLISHABLE_KEY_LIVE") ||
        readEnv("NEXT_PUBLIC_PLUREL_PUBLISHABLE_KEY"),
    ),
    testSecretKey: Boolean(readEnv("PLUREL_SECRET_KEY_TEST")),
    liveSecretKey: Boolean(readEnv("PLUREL_SECRET_KEY_LIVE") || readEnv("PLUREL_SECRET_KEY")),
    signingSecret: Boolean(signingSecret()),
    webhookTest: Boolean(readEnv("PLUREL_WEBHOOK_SECRET_TEST")),
    webhookLive: Boolean(
      readEnv("PLUREL_WEBHOOK_SECRET_LIVE") || readEnv("PLUREL_WEBHOOK_SECRET"),
    ),
  };
}
