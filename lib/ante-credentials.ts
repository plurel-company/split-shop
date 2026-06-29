import { publishableKeyMode } from "@/lib/ante-env";

export type AnteCredentialMode = "sandbox" | "live";

export const ANTE_KEY_MODE_HEADER = "x-ante-key-mode";

export function parseAnteCredentialMode(value: string | null | undefined): AnteCredentialMode {
  return value?.toLowerCase() === "live" ? "live" : "sandbox";
}

export function resolvePublishableKey(mode: AnteCredentialMode): string {
  if (mode === "live") {
    return (
      process.env.NEXT_PUBLIC_ANTE_PUBLISHABLE_KEY_LIVE?.trim() ||
      (publishableKeyMode(process.env.NEXT_PUBLIC_ANTE_PUBLISHABLE_KEY) === "live"
        ? process.env.NEXT_PUBLIC_ANTE_PUBLISHABLE_KEY?.trim()
        : "") ||
      ""
    );
  }

  return (
    process.env.NEXT_PUBLIC_ANTE_PUBLISHABLE_KEY_TEST?.trim() ||
    (publishableKeyMode(process.env.NEXT_PUBLIC_ANTE_PUBLISHABLE_KEY) !== "live"
      ? process.env.NEXT_PUBLIC_ANTE_PUBLISHABLE_KEY?.trim()
      : "") ||
    ""
  );
}

export function resolveWebhookSecret(mode: AnteCredentialMode): string {
  if (mode === "live") {
    return (
      process.env.ANTE_WEBHOOK_SECRET_LIVE?.trim() || process.env.ANTE_WEBHOOK_SECRET?.trim() || ""
    );
  }
  return (
    process.env.ANTE_WEBHOOK_SECRET_TEST?.trim() || process.env.ANTE_WEBHOOK_SECRET?.trim() || ""
  );
}

/** All configured webhook secrets — used when inbound webhooks have no mode header. */
export function listWebhookSecrets(): string[] {
  const secrets = new Set<string>();
  for (const value of [
    process.env.ANTE_WEBHOOK_SECRET_TEST,
    process.env.ANTE_WEBHOOK_SECRET,
    process.env.ANTE_WEBHOOK_SECRET_LIVE,
  ]) {
    const trimmed = value?.trim();
    if (trimmed) secrets.add(trimmed);
  }
  return [...secrets];
}

export function merchantId(): string {
  return process.env.NEXT_PUBLIC_ANTE_MERCHANT_ID?.trim() ?? "";
}

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
    testKey: Boolean(resolvePublishableKey("sandbox")),
    liveKey: Boolean(
      process.env.NEXT_PUBLIC_ANTE_PUBLISHABLE_KEY_LIVE?.trim() ||
        publishableKeyMode(process.env.NEXT_PUBLIC_ANTE_PUBLISHABLE_KEY) === "live",
    ),
    signingSecret: Boolean(signingSecret()),
    webhookTest: Boolean(
      process.env.ANTE_WEBHOOK_SECRET_TEST?.trim() || process.env.ANTE_WEBHOOK_SECRET?.trim(),
    ),
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
