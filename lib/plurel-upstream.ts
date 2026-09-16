/** Server-side Plurel Pay REST helpers — upstream auth uses secret keys (payments:write). */
import "server-only";

import type { PlurelCredentialMode } from "@/lib/plurel-credential-mode";
import { merchantId, resolveSecretKey } from "@/lib/plurel-credentials";
import { correctStaleSdkVersionHeaders } from "@/lib/installed-sdk-versions";
import { readEnv } from "@/lib/read-env";

import { getDemoRuntime } from "./demo-runtime";

export async function fetchPlurelApi(path: string, init: RequestInit): Promise<Response> {
  const runtime = getDemoRuntime();
  const base = runtime ? `${runtime.origin}/api/v1` :
    readEnv("PLUREL_API_BASE") || "https://plurelpay.com/api/v1";
  const request = new Request(`${base}${path}`, init);
  return runtime?.fetchApi ? runtime.fetchApi(request) : fetch(request);
}

const FORWARD_HEADERS = [
  "content-type",
  "x-plurel-signature",
  "x-plurel-cart-signature",
  "x-plurel-sdk-version",
  "x-plurel-react-sdk-version",
] as const;

export function secretKeyForSessions(mode: PlurelCredentialMode): string {
  if (mode !== "sandbox") throw new Error("This demonstration accepts sandbox sessions only.");
  const secretKey = resolveSecretKey(mode);
  if (!secretKey) {
    throw new Error(
      "Sandbox session credentials are not configured.",
    );
  }
  if (!/^plurel_sk_test_/.test(secretKey)) {
    throw new Error("Secret API key should start with plurel_sk_test_.");
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
    throw new Error("NEXT_PUBLIC_PLUREL_MERCHANT_ID is not configured.");
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
