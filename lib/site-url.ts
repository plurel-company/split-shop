/** Canonical public origin for metadata and absolute product image URLs. */
export const PRODUCTION_SITE_URL = "https://splitshop.dev";

/**
 * Resolve the site origin for the current deployment.
 * Prefer an explicit `NEXT_PUBLIC_SITE_URL`, then the Vercel preview host, then production.
 */
export function resolveSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (configured) return configured;

  const vercelEnv = process.env.VERCEL_ENV;
  const vercelHost = process.env.VERCEL_URL?.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (vercelHost && vercelEnv !== "production") {
    return `https://${vercelHost}`;
  }

  return PRODUCTION_SITE_URL;
}
