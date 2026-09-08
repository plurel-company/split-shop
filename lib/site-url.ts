/** Canonical public origin for metadata and absolute product image URLs. */
export const PRODUCTION_SITE_URL = "https://splitshop.dev";

/** Set NEXT_PUBLIC_SITE_URL at build time for custom and preview domains. */
export function resolveSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") || PRODUCTION_SITE_URL;
}
