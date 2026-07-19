/** Webhook secret resolution and signature verification (Node-safe, unit-testable). */
import { verifyWebhookSignature } from "@plurel/sdk/signing";

import type { PlurelCredentialMode } from "@/lib/plurel-credential-mode";
import { readEnv } from "@/lib/read-env";

type WebhookSecretCandidate = { secret: string; mode: PlurelCredentialMode };

function webhookSecretCandidates(): WebhookSecretCandidate[] {
  const out: WebhookSecretCandidate[] = [];
  const seen = new Set<string>();

  const add = (value: string | undefined, mode: PlurelCredentialMode) => {
    const trimmed = value?.trim();
    if (!trimmed || seen.has(trimmed)) return;
    seen.add(trimmed);
    out.push({ secret: trimmed, mode });
  };

  add(readEnv("PLUREL_WEBHOOK_SECRET_TEST", "ANTE_WEBHOOK_SECRET_TEST"), "sandbox");
  add(readEnv("PLUREL_WEBHOOK_SECRET_LIVE", "ANTE_WEBHOOK_SECRET_LIVE"), "live");
  add(readEnv("PLUREL_WEBHOOK_SECRET", "ANTE_WEBHOOK_SECRET"), "live");

  return out;
}

export function listWebhookSecrets(): string[] {
  return webhookSecretCandidates().map((candidate) => candidate.secret);
}

export function verifyPlurelWebhookSignature(
  rawBody: string,
  signatureHeader: string,
): PlurelCredentialMode | null {
  for (const candidate of webhookSecretCandidates()) {
    if (verifyWebhookSignature(rawBody, candidate.secret, signatureHeader)) {
      return candidate.mode;
    }
  }
  return null;
}

/** @deprecated Use verifyPlurelWebhookSignature */
export const verifyAnteWebhookSignature = verifyPlurelWebhookSignature;
