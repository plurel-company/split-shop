import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { PRODUCTION_SITE_URL, resolveSiteUrl } from "./site-url";

describe("resolveSiteUrl", () => {
  it("uses an explicit Cloudflare preview or custom domain, then the production fallback", () => {
    const previous = process.env.NEXT_PUBLIC_SITE_URL;
    try {
      process.env.NEXT_PUBLIC_SITE_URL = "https://preview.split-shop.workers.dev/";
      assert.equal(resolveSiteUrl(), "https://preview.split-shop.workers.dev");
      delete process.env.NEXT_PUBLIC_SITE_URL;
      assert.equal(resolveSiteUrl(), PRODUCTION_SITE_URL);
    } finally {
      if (previous === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
      else process.env.NEXT_PUBLIC_SITE_URL = previous;
    }
  });
});
