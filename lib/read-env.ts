import { getDemoRuntime } from "./demo-runtime";

/** Read the first non-empty environment variable from the given names. */
export function readEnv(primary: string, ...fallbacks: string[]): string {
  for (const key of [primary, ...fallbacks]) {
    const runtime = getDemoRuntime();
    const value = (runtime ? runtime.values[key] : process.env[key])?.trim();
    if (value) return value;
  }
  return "";
}
