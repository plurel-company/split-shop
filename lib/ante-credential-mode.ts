/** Client-safe test/live mode helpers (no Node crypto). */
import { publishableKeyMode } from "@/lib/ante-env";

export type AnteCredentialMode = "sandbox" | "live";

export const ANTE_KEY_MODE_HEADER = "x-ante-key-mode";

export function parseAnteCredentialMode(value: string | null | undefined): AnteCredentialMode {
  return value?.toLowerCase() === "live" ? "live" : "sandbox";
}

export function modeLabel(mode: AnteCredentialMode): string {
  return mode === "live" ? "Live" : "Test";
}

export function keyModeMatches(mode: AnteCredentialMode, key: string): boolean {
  const detected = publishableKeyMode(key);
  if (!detected) return true;
  return mode === "live" ? detected === "live" : detected === "sandbox";
}
