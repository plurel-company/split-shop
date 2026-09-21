#!/usr/bin/env node
/**
 * `pnpm run build` adapter. Workers Builds runs that script, then
 * `npx wrangler deploy`. OpenNext itself also invokes `pnpm run build` for the
 * Next.js compile, so the nested call must stay on plain `next build`.
 */
import { spawnSync } from "node:child_process";

function run(command, args, extraEnv = {}) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: false,
    env: { ...process.env, ...extraEnv },
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function verifySdk() {
  run(process.execPath, ["scripts/verify-vendored-sdk.mjs"]);
}

const forceCloudflare = process.argv.includes("--cloudflare");
const workersCi =
  process.env.WORKERS_CI === "1" ||
  process.env.WORKERS_CI === "true" ||
  Boolean(process.env.CF_PAGES);

if (process.env.OPENNEXT_INNER_BUILD === "1") {
  verifySdk();
  run("pnpm", ["exec", "next", "build"]);
} else if (forceCloudflare || workersCi) {
  run("pnpm", ["exec", "opennextjs-cloudflare", "build"], {
    OPENNEXT_INNER_BUILD: "1",
  });
} else {
  verifySdk();
  run("pnpm", ["exec", "next", "build"]);
}
