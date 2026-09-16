/** Client-safe test/live mode helpers (no Node crypto). */
import { publishableKeyMode } from "@/lib/plurel-env";

export type PlurelCredentialMode = "sandbox" | "live";

export const PLUREL_KEY_MODE_HEADER = "x-plurel-key-mode";

export function parsePlurelCredentialMode(value: string | null | undefined): PlurelCredentialMode {
  return value?.toLowerCase() === "live" ? "live" : "sandbox";
}

export function modeLabel(mode: PlurelCredentialMode): string {
  return mode === "live" ? "Live" : "Test";
}

export function keyModeMatches(mode: PlurelCredentialMode, key: string): boolean {
  const detected = publishableKeyMode(key);
  if (!detected) return true;
  return mode === "live" ? detected === "live" : detected === "sandbox";
}

/** Derive sandbox/live from the publishable key prefix — do not trust client mode headers alone. */
export function credentialModeFromPublishableKey(key: string): PlurelCredentialMode {
  const detected = publishableKeyMode(key.trim());
  if (detected === "live") return "live";
  if (detected === "sandbox") return "sandbox";
  throw new Error("Invalid publishable key — expected plurel_pk_test_* / plurel_pk_live_*");
}

/** Read key mode from request — uses x-plurel-key-mode. */
export function parseCredentialModeFromRequest(request: Request): PlurelCredentialMode {
  return parsePlurelCredentialMode(request.headers.get(PLUREL_KEY_MODE_HEADER));
}
