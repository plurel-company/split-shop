import assert from "node:assert/strict";
import { readFile, mkdir, mkdtemp, writeFile, rename, rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { test } from "node:test";
import { previewBuildEnv } from "./brand-preview-env.mjs";
import worker from "../cloudflare/brand-preview-worker.mjs";
import { publishPreview } from "./publish-brand-preview.mjs";

for (const failure of ["none", "locked", "replacement"]) {
  test(`artifact publication preserves the previous bundle on ${failure} failure`, async () => {
    const parent = resolve(import.meta.dirname, "../.brand-preview-build");
    await mkdir(parent, { recursive: true });
    const temporary = await mkdtemp(join(parent, "publish-test-"));
    const staged = join(temporary, "staged");
    const output = join(temporary, "output");
    try {
      await mkdir(staged);
      await mkdir(output);
      await writeFile(join(staged, "index.html"), "new preview");
      await writeFile(join(output, "index.html"), "previous preview");
      const publish = () => publishPreview(staged, output, async (from, to) => {
        if ((failure === "locked" && from === output) || (failure === "replacement" && from === staged)) {
          throw Object.assign(new Error("Simulated file lock"), { code: "EBUSY" });
        }
        return rename(from, to);
      });
      if (failure === "none") {
        await publish();
        assert.equal(await readFile(join(output, "index.html"), "utf8"), "new preview");
      } else {
        await assert.rejects(publish, { code: "EBUSY" });
        assert.equal(await readFile(join(output, "index.html"), "utf8"), "previous preview");
        assert.equal(await readFile(join(staged, "index.html"), "utf8"), "new preview");
      }
    } finally {
      await rm(temporary, { recursive: true, force: true });
    }
  });
}

test("preview build excludes inherited credentials, telemetry and production routing", () => {
  const env = previewBuildEnv({
    Path: "tools", SystemRoot: "windows", TEMP: "temp",
    PLUREL_SECRET_KEY_TEST: "test-only-sentinel",
    NEXT_PUBLIC_PLUREL_PUBLISHABLE_KEY_TEST: "public-sentinel",
    NEXT_PUBLIC_SITE_URL: "https://production.example",
    SENTRY_AUTH_TOKEN: "sentry-sentinel", NODE_OPTIONS: "--inspect",
    CLOUDFLARE_API_TOKEN: "cloudflare-sentinel", WORKERS_CI: "1",
  });
  assert.equal(env.Path, "tools");
  assert.equal(env.SystemRoot, "windows");
  assert.equal(env.NEXT_PUBLIC_SITE_URL, "https://splitshop-brand-preview.invalid");
  assert.equal(env.NEXT_PUBLIC_PAY_BASE_URL, "https://checkout-disabled.invalid");
  assert.equal(env.NEXT_TELEMETRY_DISABLED, "1");
  for (const key of ["PLUREL_SECRET_KEY_TEST", "NEXT_PUBLIC_PLUREL_PUBLISHABLE_KEY_TEST", "SENTRY_AUTH_TOKEN", "NODE_OPTIONS", "CLOUDFLARE_API_TOKEN", "WORKERS_CI"]) {
    assert.equal(env[key], undefined, key);
  }
});

test("preview readiness stays disconnected even if credentials are accidentally bound", async () => {
  const response = await worker.fetch(new Request("https://preview.example/api/setup/public"), {
    PLUREL_SECRET_KEY_TEST: "sentinel", ASSETS: { fetch() { throw new Error("No asset request expected"); } },
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { merchantId: "", publishableKey: "", ready: false });
  assert.match(response.headers.get("cache-control"), /no-store/);
});

test("preview refuses payment APIs and mutations without calling assets or upstream", async () => {
  const env = { ASSETS: { fetch() { throw new Error("No asset request expected"); } } };
  for (const path of ["/api/cart/sign", "/api/plurel/v1/sessions", "/api/orders/example", "/api/webhooks/plurelpay"]) {
    for (const method of ["GET", "POST", "DELETE"]) {
      const response = await worker.fetch(new Request(`https://preview.example${path}`, { method }), env);
      assert.equal(response.status, 503);
      assert.match(response.headers.get("x-robots-tag"), /noindex/);
    }
  }
  assert.equal((await worker.fetch(new Request("https://preview.example/", { method: "POST" }), env)).status, 405);
});

test("preview serves assets with noindex and preserves missing asset responses", async () => {
  for (const status of [200, 404]) {
    const response = await worker.fetch(new Request("https://preview.example/brand/logo.svg"), {
      ASSETS: { fetch: async () => new Response("asset", { status, headers: { "content-type": "image/svg+xml" } }) },
    });
    assert.equal(response.status, status);
    assert.equal(await response.text(), "asset");
    assert.equal(response.headers.get("content-type"), "image/svg+xml");
    assert.match(response.headers.get("x-robots-tag"), /noindex/);
  }
});

test("preview configuration has no production routes, credentials or shared storage", async () => {
  const config = JSON.parse(await readFile(new URL("../wrangler.brand-preview.jsonc", import.meta.url), "utf8"));
  assert.equal(config.name, "splitshop-brand-preview");
  assert.equal(config.workers_dev, true);
  assert.equal(config.assets.run_worker_first, true);
  for (const key of ["routes", "route", "account_id", "services", "hyperdrive", "r2_buckets", "kv_namespaces", "vars", "env", "build"]) {
    assert.equal(config[key], undefined, key);
  }
});
