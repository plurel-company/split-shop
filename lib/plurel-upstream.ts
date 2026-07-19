/** Server-side Plurel Pay REST helpers — upstream auth uses secret keys (payments:write). */
import "server-only";

import type { PlurelCredentialMode } from "@/lib/plurel-credential-mode";
import { merchantId, resolveSecretKey } from "@/lib/plurel-credentials";
import { correctStaleSdkVersionHeaders } from "@/lib/installed-sdk-versions";
import { readEnv } from "@/lib/read-env";

export const PLUREL_API_BASE =
  readEnv("PLUREL_API_BASE", "ANTE_API_BASE") || "https://plurelpay.com/api/v1";

/** @deprecated Use PLUREL_API_BASE */
export const ANTE_API_BASE = PLUREL_API_BASE;

const FORWARD_HEADERS = [
  "content-type",
  "x-plurel-signature",
  "x-ante-signature",
  "x-plurel-cart-signature",
  "x-ante-cart-signature",
  "x-plurel-sdk-version",
  "x-ante-sdk-version",
  "x-plurel-react-sdk-version",
  "x-ante-react-sdk-version",
] as const;

function isSecretKey(value: string): boolean {
  return value.startsWith("plurel_sk_") || value.startsWith("ante_sk_");
}

export function secretKeyForSessions(mode: PlurelCredentialMode): string {
  const secretKey = resolveSecretKey(mode);
  if (!secretKey) {
    throw new Error(
      mode === "live"
        ? "PLUREL_SECRET_KEY (or ANTE_SECRET_KEY) is not configured. Session create requires a server secret key (plurel_sk_live_*)."
        : "PLUREL_SECRET_KEY_TEST (or ANTE_SECRET_KEY_TEST) is not configured. Session create requires a server secret key (plurel_sk_test_*).",
    );
  }
  if (!isSecretKey(secretKey)) {
    throw new Error("Secret API key should start with plurel_sk_test_ / plurel_sk_live_ (or legacy ante_sk_*).");
  }
  return secretKey;
}

export function buildUpstreamSessionHeaders(
  mode: PlurelCredentialMode,
  request: Request,
): Headers {
  const secretKey = secretKeyForSessions(mode);
  const id = merchantId();
  if (!id) {
    throw new Error("NEXT_PUBLIC_PLUREL_MERCHANT_ID (or NEXT_PUBLIC_ANTE_MERCHANT_ID) is not configured.");
  }

  const headers = new Headers();
  headers.set("Authorization", `Bearer ${secretKey}`);
  headers.set("X-Merchant-ID", id);

  for (const name of FORWARD_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  correctStaleSdkVersionHeaders(headers, request);

  return headers;
}
