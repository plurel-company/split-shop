/** Prefixes are compiled into the static demo export; standalone development uses /api. */
export function demoApiPath(path: string): string {
  return `${process.env.NEXT_PUBLIC_DEMO_API_BASE || "/api"}${path}`;
}
export function demoAssetPath(path: string): string {
  return `${process.env.NEXT_PUBLIC_DEMO_BASE_PATH || ""}${path}`;
}
