import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { PRODUCTION_SITE_URL, resolveSiteUrl } from "./site-url";

describe("resolveSiteUrl", () => {
  const keys = ["NEXT_PUBLIC_SITE_URL", "VERCEL_ENV", "VERCEL_URL"] as const;
  const previous: Record<string, string | undefined> = {};

  function snapshotEnv() {
    for (const key of keys) previous[key] = process.env[key];
  }

  function restoreEnv() {
    for (const key of keys) {
      const value = previous[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }

  function clearEnv() {
    for (const key of keys) delete process.env[key];
  }

  it("prefers NEXT_PUBLIC_SITE_URL", () => {
    snapshotEnv();
    try {
      clearEnv();
      process.env.NEXT_PUBLIC_SITE_URL = "https://example.test/";
      process.env.VERCEL_ENV = "preview";
      process.env.VERCEL_URL = "preview.example";
      assert.equal(resolveSiteUrl(), "https://example.test");
    } finally {
      restoreEnv();
    }
  });

  it("uses the Vercel preview host when site URL is unset", () => {
    snapshotEnv();
    try {
      clearEnv();
      process.env.VERCEL_ENV = "preview";
      process.env.VERCEL_URL = "split-shop-git-preview-plurel.vercel.app";
      assert.equal(resolveSiteUrl(), "https://split-shop-git-preview-plurel.vercel.app");
    } finally {
      restoreEnv();
    }
  });

  it("falls back to production on Vercel production without site URL", () => {
    snapshotEnv();
    try {
      clearEnv();
      process.env.VERCEL_ENV = "production";
      process.env.VERCEL_URL = "split-shop-plurel.vercel.app";
      assert.equal(resolveSiteUrl(), PRODUCTION_SITE_URL);
    } finally {
      restoreEnv();
    }
  });
});
