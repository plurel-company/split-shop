/** Webhook secret resolution and signature verification (Node-safe, unit-testable). */
import { verifyWebhookSignature } from "@splitante/sdk/signing";

import type { AnteCredentialMode } from "@/lib/ante-credential-mode";

type WebhookSecretCandidate = { secret: string; mode: AnteCredentialMode };

function webhookSecretCandidates(): WebhookSecretCandidate[] {
  const out: WebhookSecretCandidate[] = [];
  const seen = new Set<string>();

  const add = (value: string | undefined, mode: AnteCredentialMode) => {
    const trimmed = value?.trim();
    if (!trimmed || seen.has(trimmed)) return;
    seen.add(trimmed);
    out.push({ secret: trimmed, mode });
  };

  add(process.env.ANTE_WEBHOOK_SECRET_TEST, "sandbox");
  add(process.env.ANTE_WEBHOOK_SECRET_LIVE, "live");
  add(process.env.ANTE_WEBHOOK_SECRET, "live");

  return out;
}

/** All configured webhook secrets — used when inbound webhooks have no mode header. */
export function listWebhookSecrets(): string[] {
  return webhookSecretCandidates().map((candidate) => candidate.secret);
}

/** Verify signature; returns the credential mode of the secret that matched. */
export function verifyAnteWebhookSignature(
  rawBody: string,
  signatureHeader: string,
): AnteCredentialMode | null {
  for (const candidate of webhookSecretCandidates()) {
    if (verifyWebhookSignature(rawBody, candidate.secret, signatureHeader)) {
      return candidate.mode;
    }
  }
  return null;
}
