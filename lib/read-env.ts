import { getDemoRuntime } from "./demo-runtime";

/** Read env vars with PLUREL_* primary and legacy ANTE_* / NEXT_PUBLIC_ANTE_* fallbacks. */
export function readEnv(primary: string, ...fallbacks: string[]): string {
  for (const key of [primary, ...fallbacks]) {
    const runtime = getDemoRuntime();
    const value = (runtime ? runtime.values[key] : process.env[key])?.trim();
    if (value) return value;
  }
  return "";
}

/** @deprecated Use readEnv */
export function envWithFallback(plurelName: string, legacyName: string): string {
  return readEnv(plurelName, legacyName);
}
